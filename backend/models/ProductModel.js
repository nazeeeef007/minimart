const mongoose = require('mongoose');

// Product schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    auction: {
        type: Boolean,
        default: false
    },
    auctionEndDate: {
        type: Date, // Date when the auction ends
    },
    highestBid: {
        type: Number, // Highest bid for the item
        default: 0
    },
    highestBidder: {
        type: String, // Username of the highest bidder
    },
    quantity: {
        type: Number,
        required: true,
    },
    imageUrl: {
        type: String, // URL for product image
    },
    category: {
        type: String,
        required: true, // e.g., "electronics", "food", etc.
    },
    size: {
        type: String, // Optional size attribute
        default: null, // Default value if not provided
    },
    colour: {
        type: String, // Optional colour attribute
        default: null, // Default value if not provided
    },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
