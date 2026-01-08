import mongoose from 'mongoose';

const bloodRequestSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
      min: 1,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'fulfilled'],
      default: 'pending',
    },
    patientName: String,
    patientAge: Number,
    reason: String,
    notes: String,
    respondedAt: Date,
    fulfilledAt: Date,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
bloodRequestSchema.index({ hospital: 1, createdAt: -1 });
bloodRequestSchema.index({ bloodBank: 1, status: 1 });

export default mongoose.model('BloodRequest', bloodRequestSchema);

