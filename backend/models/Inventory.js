import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
    },
    source: {
      type: String,
      enum: ['donation', 'transfer', 'purchase'],
      default: 'donation',
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
inventorySchema.index({ bloodBank: 1, bloodGroup: 1 });

export default mongoose.model('Inventory', inventorySchema);

