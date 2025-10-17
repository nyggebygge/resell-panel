/**
 * Create Admin User Script (Mongoose)
 * Run this script to create an admin user
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resell_panel';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ role: 'admin' });
        if (existingAdmin) {
            console.log('⚠️  Admin user already exists:');
            console.log(`   Email: ${existingAdmin.email}`);
            console.log(`   Username: ${existingAdmin.username}`);
            console.log(`   Role: ${existingAdmin.role}`);
            return;
        }

        // Create admin user
        const adminData = {
            username: 'admin',
            email: 'admin@resellpanel.com',
            password: 'admin123', // Change this password!
            role: 'admin',
            credits: 10000,
            isActive: true
        };

        const admin = new User(adminData);
        await admin.save();

        console.log('🎉 Admin user created successfully!');
        console.log('📧 Email:', admin.email);
        console.log('👤 Username:', admin.username);
        console.log('🔑 Password: admin123');
        console.log('💰 Credits: 10000');
        console.log('');
        console.log('⚠️  IMPORTANT: Change the password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
    }
}

// Run the script
createAdmin();
