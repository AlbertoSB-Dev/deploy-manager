const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const userSchema = new mongoose.Schema({
  email: String,
  role: String,
  name: String,
});

const User = mongoose.model('User', userSchema);

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ark-deploy');
    
    const user = await User.findOne({ email: 'beto.albertosantanabeto@gmail.com' });
    
    if (user) {
      console.log('✅ User found:');
      console.log('   Email:', user.email);
      console.log('   Role:', user.role);
      console.log('   Name:', user.name);
      
      if (user.role !== 'super_admin') {
        console.log('\n⚠️  User is NOT super_admin. Updating...');
        user.role = 'super_admin';
        await user.save();
        console.log('✅ User role updated to super_admin');
      }
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

checkUser();
