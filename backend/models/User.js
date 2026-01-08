import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'bloodbank', 'hospital', 'donor'],
      required: true,
    },
    profile: {
      // Common fields
      name: { type: String, required: true },
      phone: { type: String },
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      // Blood Bank specific
      licenseNumber: String,
      isVerified: { type: Boolean, default: false },
      // Hospital specific
      registrationNumber: String,
      // Donor specific
      dateOfBirth: Date,
      bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      },
      lastDonationDate: Date,
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

