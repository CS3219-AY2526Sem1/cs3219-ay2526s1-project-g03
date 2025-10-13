import mongoose from 'mongoose';
import {ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME, MONGO_URI} from '../constants/env.ts';
import User from '../models/user.ts';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database');

    const existingAdmin = await User.findOne({role: 'admin'});
    if (existingAdmin) {
      console.log('Admin account already exists, exiting...');
      process.exit(0);
    }

    const admin = await User.create({
      username: ADMIN_USERNAME,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      verified: true,
      profileComplete: true,
      role: 'admin',
      firstName: 'System',
      lastName: 'Administrator',
      occupation: 'information-technology',
      areaOfStudy: 'computer-science',
      markedForDeletion: false,
      deletionScheduleAt: undefined,
    });

    console.log(`Admin account created successfully: ${admin.username}`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
