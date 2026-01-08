import express from 'express';
import Donation from '../models/Donation.js';
import Camp from '../models/Camp.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// All routes require donor authentication
router.use(authenticate);
router.use(authorize('donor'));

// @route   GET /api/donor/profile
// @desc    Get donor profile
// @access  Private (Donor)
router.get('/profile', async (req, res) => {
  try {
    const donor = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      data: { donor },
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

// @route   PATCH /api/donor/profile
// @desc    Update donor profile
// @access  Private (Donor)
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
      data: { donor: user },
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

// @route   GET /api/donor/donations
// @desc    Get donor's donation history
// @access  Private (Donor)
router.get('/donations', async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id })
      .populate('bloodBank', 'profile.name profile.address')
      .populate('camp', 'name date location')
      .sort({ donationDate: -1 });

    res.json({
      success: true,
      data: { donations },
    });
  } catch (error) {
    console.error('Get donations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   GET /api/donor/eligibility
// @desc    Check donor eligibility (based on last donation date)
// @access  Private (Donor)
router.get('/eligibility', async (req, res) => {
  try {
    const donor = await User.findById(req.user._id);
    const lastDonation = await Donation.findOne({ donor: req.user._id })
      .sort({ donationDate: -1 });

    const eligibility = {
      canDonate: true,
      reason: null,
      lastDonationDate: lastDonation?.donationDate || null,
    };

    // Check if last donation was less than 56 days ago (8 weeks minimum gap)
    if (lastDonation) {
      const daysSinceLastDonation = Math.floor(
        (Date.now() - new Date(lastDonation.donationDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastDonation < 56) {
        eligibility.canDonate = false;
        eligibility.reason = `Minimum 56 days required between donations. Last donation was ${daysSinceLastDonation} days ago.`;
      }
    }

    res.json({
      success: true,
      data: { eligibility },
    });
  } catch (error) {
    console.error('Check eligibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

