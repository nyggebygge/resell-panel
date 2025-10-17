/**
 * Make Existing User Admin (Mongoose)
 * Run this script to make an existing user an admin
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });

// User Schema (same as in backend/models/User.js)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, match: /^\S+@\S+\.\S+$/ },
    password: { type: String, required: true, minlength: 6 },
    credits: { type: Number, default: 0 },
    totalDeposits: { type: Number, default: 0.00 },
    lastDeposit: { type: Date },
    keysGenerated: { type: Number, default: 0 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    theme: { type: String, enum: ['light', 'dark'], default: 'dark' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

async function makeUserAdmin() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resell_panel';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Get all users
        const users = await User.find({}, 'username email role').sort({ createdAt: 1 });
        
        if (users.length === 0) {
            console.log('❌ No users found. Please create a user first.');
            return;
        }

        console.log('👥 Available users:');
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username} (${user.email}) - Role: ${user.role}`);
        });

        // For this script, we'll make the first user an admin
        const firstUser = users[0];
        
        if (firstUser.role === 'admin') {
            console.log(`⚠️  User ${firstUser.username} is already an admin.`);
            return;
        }

        // Update user to admin
        await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
        
        console.log('🎉 User updated to admin successfully!');
        console.log(`👤 Username: ${firstUser.username}`);
        console.log(`📧 Email: ${firstUser.email}`);
        console.log(`🔑 Role: admin`);

    } catch (error) {
        console.error('❌ Error updating user to admin:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
makeUserAdmin();
