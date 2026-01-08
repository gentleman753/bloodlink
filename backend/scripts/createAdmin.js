import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables (assumes script is run from backend directory)
dotenv.config();

// Import User model
import User from '../models/User.js';

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood-link');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@bloodlink.com' });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@bloodlink.com');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = new User({
      email: 'admin@bloodlink.com',
      password: hashedPassword,
      role: 'admin',
      profile: {
        name: 'Admin User',
      },
      isActive: true,
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('\nLogin credentials:');
    console.log('Email: admin@bloodlink.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();

