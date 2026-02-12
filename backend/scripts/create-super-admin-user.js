const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  role: String,
  createdAt: { type: Date, default: Date.now },
  subscription: {
    status: String,
    planId: mongoose.Schema.Types.ObjectId,
    startDate: Date,
    endDate: Date,
    trialServersUsed: Number,
    serversCount: Number,
  },
});

const User = mongoose.model('User', userSchema);

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ark-deploy');
    
    const email = 'beto.albertosantanabeto@gmail.com';
    const password = 'admin123';
    const name = 'Super Admin';
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      console.log('✅ User already exists. Updating role to super_admin...');
      user.role = 'super_admin';
      await user.save();
      console.log('✅ User role updated to super_admin');
    } else {
      console.log('Creating new super admin user...');
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      user = new User({
        email,
        password: hashedPassword,
        name,
        role: 'super_admin',
        subscription: {
          status: 'active',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          serversCount: 100,
        },
      });
      
      await user.save();
      console.log('✅ Super admin user created successfully!');
    }
    
    console.log('\nUser details:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Name:', user.name);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createSuperAdmin();
