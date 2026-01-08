import mongoose from 'mongoose';

const inventoryTransactionSchema = new mongoose.Schema(
  {
    bloodBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    type: {
      type: String,
      enum: ['in', 'out'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      enum: ['donation', 'issue', 'transfer_in', 'transfer_out', 'expired', 'other'],
      required: true,
    },
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
    },
    relatedCamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
inventoryTransactionSchema.index({ bloodBank: 1, createdAt: -1 });

export default mongoose.model('InventoryTransaction', inventoryTransactionSchema);

