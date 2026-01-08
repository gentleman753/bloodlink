import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate, authorize, requireVerifiedBloodBank } from '../middleware/auth.js';

const router = express.Router();

// All routes require blood bank authentication
router.use(authenticate);
router.use(authorize('bloodbank'));

// @route   GET /api/bloodbank/profile
// @desc    Get blood bank profile
// @access  Private (Blood Bank)
router.get('/profile', async (req, res) => {
  try {
    const bloodBank = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: { bloodBank },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   PATCH /api/bloodbank/profile
// @desc    Update blood bank profile
// @access  Private (Blood Bank)
router.patch('/profile', async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    if (updates.profile) {
      user.profile = { ...user.profile, ...updates.profile };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { bloodBank: user },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

