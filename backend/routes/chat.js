import express from 'express';
import { body, validationResult } from 'express-validator';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// @route   GET /api/chat/conversations
// @desc    Get list of recent conversations
// @access  Private
router.get('/conversations', async (req, res) => {
  try {
    // Find all messages where user is sender or recipient
    const userId = req.user._id;

    // Aggregate to get unique conversation partners and last message
    // This is a simplified approach. Ideally we group by the "other" person.
    
    // 1. Get all messages involving the user
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
    .sort({ createdAt: -1 })
    .populate('sender', 'profile.name profile.avatar')
    .populate('recipient', 'profile.name profile.avatar');

    // 2. Extract unique partners
    const conversations = [];
    const seenPartners = new Set();

    for (const msg of messages) {
      const isSender = msg.sender._id.toString() === userId.toString();
      const partner = isSender ? msg.recipient : msg.sender;
      
      if (!seenPartners.has(partner._id.toString())) {
        seenPartners.add(partner._id.toString());
        conversations.push({
          partner,
          lastMessage: {
            content: msg.content,
            createdAt: msg.createdAt,
            isOwn: isSender,
            read: msg.read
          },
          unreadCount: 0 // Placeholder, can be calculated
        });
      }
    }

    // Calculate unread counts
    for (const conv of conversations) {
      const count = await Message.countDocuments({
        sender: conv.partner._id,
        recipient: userId,
        read: false
      });
      conv.unreadCount = count;
    }

    res.json({
      success: true,
      data: { conversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/chat/history/:userId
// @desc    Get message history with a specific user
// @access  Private
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, recipient: userId },
        { sender: userId, recipient: req.user._id }
      ]
    })
    .populate('sender', 'profile.name profile.avatar')
    .populate('recipient', 'profile.name profile.avatar')
    .sort({ createdAt: 1 }); // Oldest first

    res.json({
      success: true,
      data: { messages }
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/chat/send
// @desc    Send a message
// @access  Private
router.post('/send', [
  body('recipientId').isMongoId(),
  body('content').trim().notEmpty(),
  body('relatedRequestId').optional().isMongoId()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { recipientId, content, relatedRequestId } = req.body;

    const message = new Message({
      sender: req.user._id,
      recipient: recipientId,
      content,
      relatedRequest: relatedRequestId
    });

    await message.save();

    // Emit socket event
    // We emit to the recipient's room (their User ID)
    req.io.to(recipientId).emit('receiveMessage', {
      ...message.toObject(),
      sender: {
        _id: req.user._id,
        profile: req.user.profile
      }
    });

    res.status(201).json({
      success: true,
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/chat/read/:userId
// @desc    Mark messages from a specific user as read
// @access  Private
router.put('/read/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    await Message.updateMany(
      { sender: userId, recipient: req.user._id, read: false },
      { $set: { read: true, readAt: new Date() } }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

export default router;
