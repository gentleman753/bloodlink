import express from 'express';
import Donation from '../models/Donation.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { generateDonationCertificate } from '../utils/generateCertificate.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/certificate/:donationId
// @desc    Generate and download donation certificate (Donor only)
// @access  Private (Donor)
router.get('/:donationId', authorize('donor'), async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.donationId)
      .populate('donor')
      .populate('bloodBank');

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found',
      });
    }

    const donorId = donation.donor._id ? donation.donor._id.toString() : donation.donor.toString();
    if (donorId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this certificate',
      });
    }

    const donor = donation.donor._id ? donation.donor : await User.findById(donation.donor);
    const bloodBank = donation.bloodBank._id ? donation.bloodBank : await User.findById(donation.bloodBank);

    const pdfBuffer = await generateDonationCertificate(donation, donor, bloodBank);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="donation-certificate-${donation._id}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

