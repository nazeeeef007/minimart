const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Updated User Schema to include Voucher Requests
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
    suspended: {
        type: Boolean,
        default: false, // User is not suspended by default
    },
    // Transaction history remains unchanged
    transactionHistory: [{
        orderId: mongoose.Schema.Types.ObjectId, 
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
    voucherRequests: [{
        voucherOptionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'VoucherOption', // Referencing voucher option model
            required: true,
        },
        requestedAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['Pending', 'Approved', 'Rejected'],
            default: 'Pending',
        },
        requestDate: {
            type: Date,
            default: Date.now,
        },
        username: {  // Add the user's username
            type: String,
            required: true,
        },
        voucherBalance: {  // Add the user's voucher balance
            type: Number,
            required: true,
        },
        userId: {  // Add the user's unique ID (optional)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        adminNote: {
            type: String, // Admin can add notes upon approval or rejection
        },
    }],
    // Notifications remain unchanged
    notifications: [{
        orderId: mongoose.Schema.Types.ObjectId, // ID of the related order
        items: [{ 
            name: String, 
            quantity: Number, 
            price: Number 
        }], // Items in the order
        amount: Number,  // Total price of the order
        
        message: String,     // Notification message
        description: String, // Description with more details
        timestamp: {
            type: Date,
            default: Date.now,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    }]
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
        delete userObject.voucherRequests; // Admin does not see voucher requests
    }
    return userObject;
};

module.exports = mongoose.model('User', userSchema);
