const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

dotenv.config();

const connectDB = require('../src/config/db');
const User = require('../src/models/User');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@email.com';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const firstName = process.env.ADMIN_FIRST_NAME || 'System';
  const lastName = process.env.ADMIN_LAST_NAME || 'Admin';

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not set');
  }

  await connectDB();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    existingUser.role = 'admin';
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    existingUser.isVerified = true;
    existingUser.password = password;
    await existingUser.save();

    console.log(`Admin user updated: ${email}`);
    return;
  }

  const adminUser = new User({
    email,
    password,
    firstName,
    lastName,
    role: 'admin',
    isVerified: true,
  });

  await adminUser.save();
  console.log(`Admin user created: ${email}`);
}

seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
  });