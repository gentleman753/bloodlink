import mongoose from 'mongoose';

const campSchema = new mongoose.Schema(
  {
    bloodBank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    location: {
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    targetDonors: {
      type: Number,
      default: 0,
    },
    registeredDonors: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
campSchema.index({ bloodBank: 1, date: 1 });
campSchema.index({ date: 1, isActive: 1 });

export default mongoose.model('Camp', campSchema);

