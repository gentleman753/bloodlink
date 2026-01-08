import express from 'express';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require hospital authentication
router.use(authenticate);
router.use(authorize('hospital'));

// @route   GET /api/hospital/profile
// @desc    Get hospital profile
// @access  Private (Hospital)
router.get('/profile', async (req, res) => {
  try {
    const hospital = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: { hospital },
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

// @route   PATCH /api/hospital/profile
// @desc    Update hospital profile
// @access  Private (Hospital)
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
      data: { hospital: user },
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

