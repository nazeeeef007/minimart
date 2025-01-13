const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,  // URL for profile image
    },
    role: {
        type: String,
        enum: ['resident', 'admin'],
        default: 'resident',
    },
    voucherBalance: {
        type: Number,
        default: 0,
        required: function () {
            return this.role === 'resident';
        },
    },
    transactionHistory: [{
        itemId: mongoose.Schema.Types.ObjectId,
        itemName: String,
        quantity: Number,
        totalPrice: Number,
        transactionDate: {
            type: Date,
            default: Date.now,
        },
        isApproved: {
            type: Boolean,
            default: false, // Requests are pending approval by default
        },
    }],
});

// Hash password before saving to the database
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
    const userObject = this.toObject();
    if (userObject.role === 'admin') {
        delete userObject.voucherBalance;
        delete userObject.transactionHistory;
    }
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
