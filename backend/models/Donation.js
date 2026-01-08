import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bloodBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    camp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Camp',
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    donationDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    notes: String,
    certificateGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
donationSchema.index({ donor: 1, donationDate: -1 });
donationSchema.index({ bloodBank: 1, donationDate: -1 });

export default mongoose.model('Donation', donationSchema);

