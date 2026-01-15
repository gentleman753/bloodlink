import express from 'express';
import { body, validationResult } from 'express-validator';
import BloodRequest from '../models/BloodRequest.js';
import Inventory from '../models/Inventory.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireVerifiedBloodBank } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/requests
// @desc    Get blood requests (filtered by role)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    // Hospitals see their own requests
    if (req.user.role === 'hospital') {
      query.hospital = req.user._id;
    }
    // Blood banks see requests to them
    else if (req.user.role === 'bloodbank') {
      query.bloodBank = req.user._id;
    }
    // Admins see all requests

    const requests = await BloodRequest.find(query)
      .populate('hospital', 'profile.name profile.address profile.phone')
      .populate('bloodBank', 'profile.name profile.address profile.phone')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/requests
// @desc    Create a blood request (Hospital only)
// @access  Private (Hospital)
router.post(
  '/',
  authorize('hospital'),
  [
    body('bloodBank').isMongoId(),
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('quantity').isInt({ min: 1 }),
    body('urgency').optional().isIn(['low', 'medium', 'high', 'critical']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        bloodBank,
        bloodGroup,
        quantity,
        urgency,
        patientName,
        patientAge,
        reason,
        notes,
      } = req.body;

      // Verify blood bank exists and is verified
      const bloodBankUser = await User.findById(bloodBank);
      if (!bloodBankUser || bloodBankUser.role !== 'bloodbank') {
        return res.status(404).json({
          success: false,
          message: 'Blood bank not found',
        });
      }

      if (!bloodBankUser.profile.isVerified) {
        return res.status(400).json({
          success: false,
          message: 'Blood bank is not verified',
        });
      }

      // Create request
      const request = new BloodRequest({
        hospital: req.user._id,
        bloodBank,
        bloodGroup,
        quantity,
        urgency: urgency || 'medium',
        patientName,
        patientAge,
        reason,
        notes,
      });

      await request.save();

      const populatedRequest = await BloodRequest.findById(request._id)
        .populate('hospital', 'profile.name profile.address profile.phone')
        .populate('bloodBank', 'profile.name profile.address profile.phone');

      // 1. Notify the specific Blood Bank
      await Notification.create({
        recipient: bloodBank,
        title: 'New Blood Request',
        message: `${req.user.profile.name} requested ${quantity} units of ${bloodGroup}`,
        type: 'request',
        relatedId: request._id,
      });

      // Emit to Blood Bank's personal room (using their User ID)
      console.log(`Emitting to Blood Bank room: ${bloodBank.toString()}`);
      req.io.to(bloodBank.toString()).emit('newBloodRequest', {
        ...populatedRequest.toObject(),
        notificationType: 'personal'
      });


      // 2. Notify Nearby Donors
      const hospitalCity = req.user.profile?.address?.city;
      if (hospitalCity) {
        // Find donors in the same city
        const donors = await User.find({
          role: 'donor',
          'profile.address.city': new RegExp(`^${hospitalCity}$`, 'i'),
        }).select('_id');

        if (donors.length > 0) {
          // Create notifications for all nearby donors
          const donorNotifications = donors.map((donor) => ({
            recipient: donor._id,
            title: 'Urgent Blood Need Nearby',
            message: `${req.user.profile.name} in ${hospitalCity} needs ${quantity} units of ${bloodGroup}`,
            type: 'alert',
            relatedId: request._id,
          }));

          await Notification.insertMany(donorNotifications);

          // Emit to city-based donor room
          const roomName = `donors_${hospitalCity.toLowerCase()}`;
          req.io.to(roomName).emit('newBloodRequest', {
             ...populatedRequest.toObject(),
             notificationType: 'broadcast',
             message: `Urgent: ${bloodGroup} needed at ${req.user.profile.name}`
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Blood request created successfully',
        data: { request: populatedRequest },
      });
    } catch (error) {
      console.error('Create request error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   PATCH /api/requests/:id/approve
// @desc    Approve a blood request (Blood Bank only)
// @access  Private (Blood Bank)
router.patch('/:id/approve', requireVerifiedBloodBank, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.bloodBank.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to approve this request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    // Check inventory availability
    const availableInventory = await Inventory.find({
      bloodBank: req.user._id,
      bloodGroup: request.bloodGroup,
    });

    const totalAvailable = availableInventory.reduce((sum, item) => sum + item.quantity, 0);

    if (totalAvailable < request.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient inventory. Available: ${totalAvailable}, Requested: ${request.quantity}`,
      });
    }

    // Issue blood from inventory
    let remainingToIssue = request.quantity;

    for (const item of availableInventory.sort((a, b) => a.createdAt - b.createdAt)) {
      if (remainingToIssue <= 0) break;

      const issueAmount = Math.min(item.quantity, remainingToIssue);
      item.quantity -= issueAmount;
      remainingToIssue -= issueAmount;

      if (item.quantity === 0) {
        await Inventory.findByIdAndDelete(item._id);
      } else {
        await item.save();
      }
    }

    // Create transaction record
    const transaction = new InventoryTransaction({
      bloodBank: req.user._id,
      bloodGroup: request.bloodGroup,
      type: 'out',
      quantity: request.quantity,
      reason: 'issue',
      relatedRequest: request._id,
      notes: `Approved request from ${request.hospital}`,
    });

    await transaction.save();

    // Update request status
    request.status = 'approved';
    request.respondedAt = new Date();
    await request.save();

    const populatedRequest = await BloodRequest.findById(request._id)
      .populate('hospital', 'profile.name profile.address profile.phone')
      .populate('bloodBank', 'profile.name profile.address profile.phone');

    // Emit socket event
    req.io.to(request.hospital.toString()).emit('requestUpdated', populatedRequest);
    req.io.to(request.bloodBank.toString()).emit('requestUpdated', populatedRequest);

    res.json({
      success: true,
      message: 'Request approved and blood issued successfully',
      data: { request: populatedRequest },
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PATCH /api/requests/:id/reject
// @desc    Reject a blood request (Blood Bank only)
// @access  Private (Blood Bank)
router.patch('/:id/reject', requireVerifiedBloodBank, async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.bloodBank.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request is already ${request.status}`,
      });
    }

    request.status = 'rejected';
    request.respondedAt = new Date();
    await request.save();

    const populatedRequest = await BloodRequest.findById(request._id)
      .populate('hospital', 'profile.name profile.address profile.phone')
      .populate('bloodBank', 'profile.name profile.address profile.phone');

    // Emit socket event
    req.io.to(request.hospital.toString()).emit('requestUpdated', populatedRequest);
    req.io.to(request.bloodBank.toString()).emit('requestUpdated', populatedRequest);

    res.json({
      success: true,
      message: 'Request rejected',
      data: { request: populatedRequest },
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PATCH /api/requests/:id/fulfill
// @desc    Mark request as fulfilled (Hospital only)
// @access  Private (Hospital)
router.patch('/:id/fulfill', authorize('hospital'), async (req, res) => {
  try {
    const request = await BloodRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    if (request.hospital.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to fulfill this request',
      });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved requests can be marked as fulfilled',
      });
    }

    request.status = 'fulfilled';
    request.fulfilledAt = new Date();
    await request.save();

    const populatedRequest = await BloodRequest.findById(request._id)
      .populate('hospital', 'profile.name profile.address profile.phone')
      .populate('bloodBank', 'profile.name profile.address profile.phone');

    // Emit socket event
    req.io.to(request.hospital.toString()).emit('requestUpdated', populatedRequest);
    req.io.to(request.bloodBank.toString()).emit('requestUpdated', populatedRequest);

    res.json({
      success: true,
      message: 'Request marked as fulfilled',
      data: { request: populatedRequest },
    });
  } catch (error) {
    console.error('Fulfill request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/requests/search/bloodbanks
// @desc    Search blood banks by location and blood group (Hospital only)
// @access  Private (Hospital)
router.get('/search/bloodbanks', authorize('hospital'), async (req, res) => {
  try {
    const { bloodGroup, city, state } = req.query;

    let query = {
      role: 'bloodbank',
      'profile.isVerified': true,
      isActive: true,
    };

    if (city) {
      query['profile.address.city'] = new RegExp(city, 'i');
    }

    if (state) {
      query['profile.address.state'] = new RegExp(state, 'i');
    }

    const bloodBanks = await User.find(query).select('-password');

    // Get inventory for each blood bank
    const bloodBanksWithInventory = await Promise.all(
      bloodBanks.map(async (bank) => {
        let inventoryQuery = { bloodBank: bank._id };
        if (bloodGroup) {
          inventoryQuery.bloodGroup = bloodGroup;
        }

        const inventory = await Inventory.find(inventoryQuery);
        const totalByGroup = inventory.reduce((acc, item) => {
          acc[item.bloodGroup] = (acc[item.bloodGroup] || 0) + item.quantity;
          return acc;
        }, {});

        return {
          ...bank.toObject(),
          inventory: totalByGroup,
        };
      })
    );

    res.json({
      success: true,
      data: { bloodBanks: bloodBanksWithInventory },
    });
  } catch (error) {
    console.error('Search blood banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;
