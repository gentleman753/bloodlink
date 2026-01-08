import express from 'express';
import { body, validationResult } from 'express-validator';
import Inventory from '../models/Inventory.js';
import InventoryTransaction from '../models/InventoryTransaction.js';
import { authenticate, authorize, requireVerifiedBloodBank } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/inventory
// @desc    Get inventory (Blood Bank sees own, Hospital/Admin sees all)
// @access  Private
router.get('/', async (req, res) => {
  try {
    let query = {};

    // Blood banks only see their own inventory
    if (req.user.role === 'bloodbank') {
      query.bloodBank = req.user._id;
    }

    const inventory = await Inventory.find(query)
      .populate('bloodBank', 'profile.name profile.address')
      .sort({ bloodGroup: 1, createdAt: -1 });

    // Aggregate by blood group
    const aggregated = inventory.reduce((acc, item) => {
      const key = `${item.bloodBank._id}_${item.bloodGroup}`;
      if (!acc[key]) {
        acc[key] = {
          bloodBank: item.bloodBank,
          bloodGroup: item.bloodGroup,
          quantity: 0,
          items: [],
        };
      }
      acc[key].quantity += item.quantity;
      acc[key].items.push(item);
      return acc;
    }, {});

    const aggregatedInventory = Object.values(aggregated);

    res.json({
      success: true,
      data: {
        inventory: aggregatedInventory,
        raw: inventory,
      },
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

// @route   POST /api/inventory
// @desc    Add blood to inventory (Blood Bank only)
// @access  Private (Blood Bank)
router.post(
  '/',
  requireVerifiedBloodBank,
  [
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('quantity').isInt({ min: 1 }),
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

      const { bloodGroup, quantity, expiryDate, source, notes } = req.body;

      // Create inventory entry
      const inventory = new Inventory({
        bloodBank: req.user._id,
        bloodGroup,
        quantity,
        expiryDate,
        source: source || 'donation',
        notes,
      });

      await inventory.save();

      // Create transaction record
      const transaction = new InventoryTransaction({
        bloodBank: req.user._id,
        bloodGroup,
        type: 'in',
        quantity,
        reason: source || 'donation',
        notes,
      });

      await transaction.save();

      res.status(201).json({
        success: true,
        message: 'Blood added to inventory successfully',
        data: { inventory },
      });
    } catch (error) {
      console.error('Add inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/inventory/issue
// @desc    Issue blood from inventory (Blood Bank only)
// @access  Private (Blood Bank)
router.post(
  '/issue',
  requireVerifiedBloodBank,
  [
    body('bloodGroup').isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
    body('quantity').isInt({ min: 1 }),
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

      const { bloodGroup, quantity, relatedRequest, notes } = req.body;

      // Check available inventory
      const availableInventory = await Inventory.find({
        bloodBank: req.user._id,
        bloodGroup,
      });

      const totalAvailable = availableInventory.reduce((sum, item) => sum + item.quantity, 0);

      if (totalAvailable < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient inventory. Available: ${totalAvailable}, Requested: ${quantity}`,
        });
      }

      // Issue blood (FIFO - First In First Out)
      let remainingToIssue = quantity;
      const issuedItems = [];

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

        issuedItems.push({ itemId: item._id, quantity: issueAmount });
      }

      // Create transaction record
      const transaction = new InventoryTransaction({
        bloodBank: req.user._id,
        bloodGroup,
        type: 'out',
        quantity,
        reason: 'issue',
        relatedRequest,
        notes,
      });

      await transaction.save();

      res.json({
        success: true,
        message: 'Blood issued successfully',
        data: { transaction, issuedItems },
      });
    } catch (error) {
      console.error('Issue inventory error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message,
      });
    }
  }
);

// @route   GET /api/inventory/transactions
// @desc    Get inventory transactions (Blood Bank only)
// @access  Private (Blood Bank)
router.get('/transactions', requireVerifiedBloodBank, async (req, res) => {
  try {
    const transactions = await InventoryTransaction.find({ bloodBank: req.user._id })
      .populate('relatedRequest', 'hospital bloodGroup quantity status')
      .populate('relatedCamp', 'name date')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: { transactions },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
});

export default router;

