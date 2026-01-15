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
        name: 'Lilavati Blood Bank',
        address: {
          street: 'A-791, Bandra Reclamation, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400050',
        },
        licenseNumber: 'MH-BB-1024',
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
        name: 'Nanavati Super Speciality Hospital',
        address: {
          street: 'SV Road, Vile Parle West',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400056',
        },
        registrationNumber: 'MH-HOSP-5567',
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
        name: 'Rajesh Sharma',
        phone: '9876543210',
        bloodGroup: 'O+',
        dateOfBirth: new Date('1995-08-15'),
        gender: 'Male',
        address: {
          city: 'Mumbai',
          state: 'Maharashtra',
        },
      },
    });
    await donor.save();
    console.log('Donor user created');

    // Add Inventory to Blood Bank
    const inventory = new Inventory({
      bloodBank: bloodBank._id,
      bloodGroup: 'O+',
      quantity: 15,
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
      patientName: 'Suresh Patil',
      reason: 'Emergency Surgery',
    });
    await request.save();
    console.log('Blood Request created');

    // Create Camp
    const camp = new Camp({
      bloodBank: bloodBank._id,
      name: 'Shivaji Park Donation Drive',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      startTime: '09:00',
      endTime: '17:00',
      location: {
        address: 'Shivaji Park, Dadar',
        city: 'Mumbai',
        state: 'Maharashtra',
      },
      description: 'Join us for a blood donation drive to save lives!',
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
