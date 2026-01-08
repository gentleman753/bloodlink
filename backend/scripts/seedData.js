import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Inventory from '../models/Inventory.js';
import BloodRequest from '../models/BloodRequest.js';
import Camp from '../models/Camp.js';
import dotenv from 'dotenv';

dotenv.config();

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected!');

    // Clear existing data
    await User.deleteMany({});
    await Inventory.deleteMany({});
    await BloodRequest.deleteMany({});
    await Camp.deleteMany({});
    console.log('Cleared existing data.');

    // Create Admin
    const admin = new User({
      email: 'admin@bloodlink.com',
      password: 'password123',
      role: 'admin',
      profile: { name: 'Admin User' },
    });
    await admin.save();
    console.log('Admin user created');

    // Create Blood Bank
    const bloodBank = new User({
      email: 'bb@bloodlink.com',
      password: 'password123',
      role: 'bloodbank',
      profile: {
        name: 'City Blood Bank',
        address: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
        licenseNumber: 'BB-12345',
        isVerified: true,
      },
    });
    await bloodBank.save();
    console.log('Blood Bank user created');

    // Create Hospital
    const hospital = new User({
      email: 'hospital@bloodlink.com',
      password: 'password123',
      role: 'hospital',
      profile: {
        name: 'General Hospital',
        address: {
          street: '456 Healthcare Blvd',
          city: 'New York',
          state: 'NY',
          zipCode: '10002',
        },
        registrationNumber: 'HOSP-67890',
        isVerified: true,
      },
    });
    await hospital.save();
    console.log('Hospital user created');

    // Create Donor
    const donor = new User({
      email: 'donor@bloodlink.com',
      password: 'password123',
      role: 'donor',
      profile: {
        name: 'John Doe',
        phone: '555-0101',
        bloodGroup: 'O+',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'Male',
        address: {
          city: 'New York',
          state: 'NY',
        },
      },
    });
    await donor.save();
    console.log('Donor user created');

    // Add Inventory to Blood Bank
    const inventory = new Inventory({
      bloodBank: bloodBank._id,
      bloodGroup: 'O+',
      quantity: 10,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      source: 'donation',
    });
    await inventory.save();
    console.log('Inventory added');

    // Create Blood Request
    const request = new BloodRequest({
      hospital: hospital._id,
      bloodBank: bloodBank._id,
      bloodGroup: 'O+',
      quantity: 2,
      urgency: 'high',
      status: 'pending',
      patientName: 'Jane Smith',
      reason: 'Surgery',
    });
    await request.save();
    console.log('Blood Request created');

    // Create Camp
    const camp = new Camp({
      bloodBank: bloodBank._id,
      name: 'City Square Donation Camp',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startTime: '09:00',
      endTime: '17:00',
      location: {
        address: 'City Square Park',
        city: 'New York',
        state: 'NY',
      },
      description: 'Join us for a blood donation drive!',
    });
    await camp.save();
    console.log('Camp created');

    console.log('Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
