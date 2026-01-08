import express from 'express';
import User from '../models/User.js';
import BloodRequest from '../models/BloodRequest.js';
import Inventory from '../models/Inventory.js';
import Donation from '../models/Donation.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(authorize('admin'));

// @route   GET /api/admin/bloodbanks
// @desc    Get all blood banks
// @access  Private (Admin)
router.get('/bloodbanks', async (req, res) => {
  try {
    const bloodBanks = await User.find({ role: 'bloodbank' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { bloodBanks },
    });
  } catch (error) {
    console.error('Get blood banks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/hospitals
// @desc    Get all hospitals
// @access  Private (Admin)
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await User.find({ role: 'hospital' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { hospitals },
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PATCH /api/admin/verify/:id
// @desc    Verify a blood bank or hospital
// @access  Private (Admin)
router.patch('/verify/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!['bloodbank', 'hospital'].includes(user.role)) {
      return res.status(400).json({
        success: false,
        message: 'Only blood banks and hospitals can be verified',
      });
    }

    user.profile.isVerified = true;
    await user.save();

    res.json({
      success: true,
      message: `${user.role} verified successfully`,
      data: { user },
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PATCH /api/admin/unverify/:id
// @desc    Unverify a blood bank or hospital
// @access  Private (Admin)
router.patch('/unverify/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    user.profile.isVerified = false;
    await user.save();

    res.json({
      success: true,
      message: `${user.role} unverified successfully`,
      data: { user },
    });
  } catch (error) {
    console.error('Unverify user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Remove a user
// @access  Private (Admin)
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users',
      });
    }

    // Soft delete
    user.isActive = false;
    await user.save();

    res.json({
      success: true,
      message: 'User removed successfully',
    });
  } catch (error) {
    console.error('Remove user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/admin/analytics
// @desc    Get system-wide analytics
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    // Aggregate inventory by blood group
    const inventoryAggregation = await Inventory.aggregate([
      {
        $group: {
          _id: '$bloodGroup',
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    const totalBloodUnits = inventoryAggregation.reduce(
      (sum, item) => sum + item.totalQuantity,
      0
    );

    // Count donors
    const totalDonors = await User.countDocuments({ role: 'donor', isActive: true });

    // Count pending requests
    const pendingRequests = await BloodRequest.countDocuments({ status: 'pending' });

    // Count total donations
    const totalDonations = await Donation.countDocuments();

    // Count blood banks and hospitals
    const totalBloodBanks = await User.countDocuments({ role: 'bloodbank', isActive: true });
    const totalHospitals = await User.countDocuments({ role: 'hospital', isActive: true });

    res.json({
      success: true,
      data: {
        totalBloodUnits,
        bloodGroupBreakdown: inventoryAggregation,
        totalDonors,
        pendingRequests,
        totalDonations,
        totalBloodBanks,
        totalHospitals,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

