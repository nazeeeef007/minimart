const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Product = require('../models/ProductModel');  // Import Product model
const Order = require('../models/OrderModel');  // Import Product model
dotenv.config();



// Controller to get the resident's voucher balance
const getVoucherBalance = async (req, res) => {
    try {
        // Fetch the user from the database using the user ID from the JWT token
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Return the voucher balance of the resident
        res.status(200).json({ voucherBalance: user.voucherBalance });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to get a resident's transaction history
const getTransactionHistory = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user is set in req.user by verifyToken middleware
        const user = await User.findById(userId).select('transactionHistory');
        
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
    
        // Ensure transactionHistory is an array
        if (!Array.isArray(user.transactionHistory)) {
            return res.status(500).json({ message: 'Invalid transaction history format' });
        }

        // Filter transactions based on approval status
        const pendingTransactions = user.transactionHistory.filter(transaction => !transaction.isApproved);
        const approvedTransactions = user.transactionHistory.filter(transaction => transaction.isApproved);

        // If no transactions are found
        if (!pendingTransactions.length && !approvedTransactions.length) {
            return res.status(200).json({ message: 'No transactions found.' });
        }

        return res.status(200).json({
          pendingTransactions,
          approvedTransactions
        });
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
};


// Controller to get a product by its ID
const getProduct = async (req, res) => {
    try {
      const products = await Product.find(); // Fetch all products from the database
      res.status(200).json({ products });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  };





// Checkout function for residents
const checkout = async (req, res) => {
    try {
      const userId = req.user.id; // Assuming user is set in req.user by verifyToken middleware
      const { items } = req.body; // Items in the cart passed from the frontend
  
      if (!items || items.length === 0) {
        return res.status(400).json({ message: 'No items in the cart' });
      }
  
      // Fetch the user's voucher balance
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      const voucherBalance = user.voucherBalance;
  
      // Initialize total price and order items array
      let totalPrice = 0;
      const orderItems = [];
  
      for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.productId}` });
        }
  
        // Check if the product has enough stock
        if (product.quantity < item.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        }
  
        // Add product price to total price
        totalPrice += product.price * item.quantity;
  
        // Prepare order item with product details
        orderItems.push({
          productId: product._id,
          name: product.name,
          price: product.price,
          imageUrl: product.imageUrl,
          category: product.category,
          quantity: item.quantity
        });
      }
  
      // Check if the user has enough voucher balance
      if (voucherBalance < totalPrice) {
        return res.status(400).json({ message: 'Insufficient voucher balance' });
      }
  
      // Process the cart: update inventory and voucher balance
      for (const item of items) {
        const product = await Product.findById(item.productId);
        product.quantity -= item.quantity; // Reduce the stock
        await product.save();
      }
  
      // Deduct the total price from the user's voucher balance
      user.voucherBalance -= totalPrice;
      await user.save();
  
      // Create an order record
      const order = new Order({
        userId,
        items: orderItems,
        totalPrice,
        status: 'Completed', // Customize the order status if needed
        date: new Date()
      });
  
      await order.save();

      // Add the order to the user's transaction history as a pending request
      for (const item of items) {
        // Add to user's transaction history as pending
        console.log('Item price:', item.price, 'Item quantity:', item.quantity);
        if (isNaN(item.price * item.quantity)) {
            return res.status(400).json({ message: 'Invalid price or quantity in transaction history' });
          }
          
        user.transactionHistory.push({
            itemId: item.productId,
            itemName: item.name,
            quantity: item.quantity,
            totalPrice: item.price * item.quantity,
            isApproved: false, // Initially set to false (pending approval)
            });
      }
      
    
        await user.save();
      console.log("ok");
      // Return success response
      return res.status(200).json({ message: 'Checkout successful', totalPrice, order,
        transactionHistory: user.transactionHistory });
    } catch (error) {
      console.error('Error during checkout:', error);
      return res.status(500).json({ message: 'Something went wrong. Please try again later.' });
    }
  };


// Controller to reset the password
const resetPassword = async (req, res) => {
    console.log('Request body:', req.body);  // Log the entire request body to see the data being sent
    const { oldPassword, newPassword } = req.body;
    console.log('Old Password:', oldPassword);  // Log the old password
    console.log('New Password:', newPassword);  // Log the new password

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ message: 'Old password and new password are required' });
    }

    try {
        // Find the user by their ID (assumes the user is authenticated via JWT and their ID is in req.user.id)
        const user = await User.findById(req.user.id);
        console.log('User fetched:', user);  // Log the fetched user object

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Compare the provided old password with the stored password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        console.log('Password comparison result:', isMatch);  // Log the result of password comparison

        if (!isMatch) {
            return res.status(400).json({ message: 'Old password is incorrect' });
        }

        // Hash the new password
        user.password = newPassword; // No need to hash manually

        // Save the updated user object
        await user.save();

        // Respond with a success message
        res.status(200).json({ message: 'Password reset successfully' });

    } catch (error) {
        console.error('Error occurred during password reset:', error);  // Log any errors
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports = {
    getVoucherBalance,
    getTransactionHistory,
    getProduct,
    checkout,
    resetPassword
};
