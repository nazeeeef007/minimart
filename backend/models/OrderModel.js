const mongoose = require('mongoose');

// Define the schema for an Order
const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Linking to the User model
    required: true
  },
  username: { type: String, required: true }, // Add this if missing
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Linking to the Product model
        required: true
      },
      name: {
        type: String,
        required: true
      },
      price: {
        type: Number,
        required: true
      },
      imageUrl: {
        type: String
      },
      category: {
        type: String,
        required: true
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      }
    }
  ],
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Rejected'],
    default: 'Pending'
  },
  rejectionDescription: {
    type: String, // Non-required field to store rejection reason
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create the Order model from the schema
const Order = mongoose.model('Order', OrderSchema);

module.exports = Order;
