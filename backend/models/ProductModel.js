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
}, { timestamps: true });

// Export the Product model
module.exports = mongoose.model('Product', productSchema);
