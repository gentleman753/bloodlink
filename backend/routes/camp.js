import express from 'express';
import { body, validationResult } from 'express-validator';
import Camp from '../models/Camp.js';
import Donation from '../models/Donation.js';
import Inventory from '../models/Inventory.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { requireVerifiedBloodBank } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/camps
// @desc    Get camps (filtered by role)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    // Blood banks see their own camps
    if (req.user.role === 'bloodbank') {
      query.bloodBank = req.user._id;
    }
    // Donors see active upcoming camps
    else if (req.user.role === 'donor') {
      query.isActive = true;
      query.date = { $gte: new Date() };
    }
    // Admins see all camps

    const camps = await Camp.find(query)
      .populate('bloodBank', 'profile.name profile.address')
      .populate('registeredDonors.donor', 'profile.name profile.bloodGroup')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: { camps },
    });
  } catch (error) {
    console.error('Get camps error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/camps
// @desc    Create a donation camp (Blood Bank only)
// @access  Private (Blood Bank)
router.post(
  '/',
  requireVerifiedBloodBank,
  [
    body('name').trim().notEmpty(),
    body('date').isISO8601(),
    body('startTime').notEmpty(),
    body('endTime').notEmpty(),
    body('location.address').notEmpty(),
    body('location.city').notEmpty(),
    body('location.state').notEmpty(),
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

      const { name, description, date, startTime, endTime, location, targetDonors } = req.body;

      const camp = new Camp({
        bloodBank: req.user._id,
        name,
        description,
        date,
        startTime,
        endTime,
        location,
        targetDonors: targetDonors || 0,
      });

      await camp.save();

      const populatedCamp = await Camp.findById(camp._id)
        .populate('bloodBank', 'profile.name profile.address');

      res.status(201).json({
        success: true,
        message: 'Camp created successfully',
        data: { camp: populatedCamp },
      });
    } catch (error) {
      console.error('Create camp error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/camps/:id/register
// @desc    Register for a camp (Donor only)
// @access  Private (Donor)
router.post('/:id/register', authorize('donor'), async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    if (!camp.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Camp is not active',
      });
    }

    if (new Date(camp.date) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Camp date has passed',
      });
    }

    // Check if already registered
    const alreadyRegistered = camp.registeredDonors.some(
      (reg) => reg.donor.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this camp',
      });
    }

    camp.registeredDonors.push({
      donor: req.user._id,
      registeredAt: new Date(),
    });

    await camp.save();

    const populatedCamp = await Camp.findById(camp._id)
      .populate('bloodBank', 'profile.name profile.address')
      .populate('registeredDonors.donor', 'profile.name profile.bloodGroup');

    res.json({
      success: true,
      message: 'Registered for camp successfully',
      data: { camp: populatedCamp },
    });
  } catch (error) {
    console.error('Register camp error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/camps/:id/donations
// @desc    Record a donation at a camp (Blood Bank only)
// @access  Private (Blood Bank)
router.post(
  '/:id/donations',
  requireVerifiedBloodBank,
  [
    body('donor').isMongoId(),
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('quantity').optional().isInt({ min: 1 }),
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

      const camp = await Camp.findById(req.params.id);

      if (!camp) {
        return res.status(404).json({
          success: false,
          message: 'Camp not found',
        });
      }

      if (camp.bloodBank.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to record donations for this camp',
        });
      }

      const { donor, bloodGroup, quantity, notes } = req.body;

      // Calculate expiry date (42 days from donation)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 42);

      // Create donation record
      const donation = new Donation({
        donor,
        bloodBank: req.user._id,
        camp: camp._id,
        bloodGroup,
        quantity: quantity || 1,
        donationDate: new Date(),
        expiryDate,
        notes,
      });

      await donation.save();

      // Add to inventory
      const inventory = new Inventory({
        bloodBank: req.user._id,
        bloodGroup,
        quantity: quantity || 1,
        expiryDate,
        source: 'donation',
        notes: `From camp: ${camp.name}`,
      });

      await inventory.save();

      // Create transaction record
      const transaction = new InventoryTransaction({
        bloodBank: req.user._id,
        bloodGroup,
        type: 'in',
        quantity: quantity || 1,
        reason: 'donation',
        relatedCamp: camp._id,
        notes: `Donation from camp: ${camp.name}`,
      });

      await transaction.save();

      // Update donor's last donation date
      const { default: User } = await import('../models/User.js');
      await User.findByIdAndUpdate(donor, {
        'profile.lastDonationDate': new Date(),
      });

      const populatedDonation = await Donation.findById(donation._id)
        .populate('donor', 'profile.name profile.bloodGroup')
        .populate('bloodBank', 'profile.name')
        .populate('camp', 'name date');

      res.status(201).json({
        success: true,
        message: 'Donation recorded successfully',
        data: { donation: populatedDonation },
      });
    } catch (error) {
      console.error('Record donation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   PATCH /api/camps/:id
// @desc    Update a camp (Blood Bank only)
// @access  Private (Blood Bank)
router.patch('/:id', requireVerifiedBloodBank, async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    if (camp.bloodBank.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this camp',
      });
    }

    Object.assign(camp, req.body);
    await camp.save();

    const populatedCamp = await Camp.findById(camp._id)
      .populate('bloodBank', 'profile.name profile.address')
      .populate('registeredDonors.donor', 'profile.name profile.bloodGroup');

    res.json({
      success: true,
      message: 'Camp updated successfully',
      data: { camp: populatedCamp },
    });
  } catch (error) {
    console.error('Update camp error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   DELETE /api/camps/:id
// @desc    Delete a camp (Blood Bank only)
// @access  Private (Blood Bank)
router.delete('/:id', requireVerifiedBloodBank, async (req, res) => {
  try {
    const camp = await Camp.findById(req.params.id);

    if (!camp) {
      return res.status(404).json({
        success: false,
        message: 'Camp not found',
      });
    }

    if (camp.bloodBank.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this camp',
      });
    }

    camp.isActive = false;
    await camp.save();

    res.json({
      success: true,
      message: 'Camp deactivated successfully',
    });
  } catch (error) {
    console.error('Delete camp error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

