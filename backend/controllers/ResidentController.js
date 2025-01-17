const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const Product = require('../models/ProductModel');  // Import Product model
const Order = require('../models/OrderModel');  // Import Product model
const VoucherOption = require('../models/VoucherOptionModel');
const mongoose = require('mongoose');
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

    

    console.log(pendingTransactions); // Log to check the conversion
    // Return response with filtered transactions
    console.log('ok')
    return res.status(200).json({
      pendingTransactions: pendingTransactions,
      approvedTransactions: approvedTransactions
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
    const { items, username } = req.body; // Items in the cart passed from the frontend
    
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
        quantity: item.quantity,
        username: username
      });
    }
    console.log(username); 
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

    // Create an order record with status as "Pending"
    const order = new Order({
      userId,
      username, 
      items: orderItems,
      totalPrice,
      status: 'Pending', // Initial status is pending, awaiting admin approval
      date: new Date()
    });

    console.log('Order to be saved:', order);  // Check order details before saving
    await order.save();

    // Add the order to the user's transaction history as a pending request
    for (const item of items) {
      user.transactionHistory.push({
        orderId: order._id,  // Add the orderId here
        itemId: item.productId,
        itemName: item.name,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        isApproved: false // Initially set to false (pending approval)
      });
    }

    await user.save();

    // Return success response
    return res.status(200).json({
      message: 'Checkout successful. Awaiting admin approval.',
      totalPrice,
      order,
      transactionHistory: user.transactionHistory
    });
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

// Mark all notifications as read
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from the token

    // Find the user by ID and update the notifications to mark them as read
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update all notifications to be marked as read
    user.notifications.forEach(notification => {
      if (!notification.isRead) {
        notification.isRead = true;
      }
    });

    await user.save(); // Save the updated user document

    res.status(200).json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
};

// Fetch notifications for a resident
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming `user.id` is extracted from the token
    
    // Find the user by ID and populate notifications
    const user = await User.findById(userId).select('notifications');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return the notifications
    res.status(200).json({ notifications: user.notifications });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
};

const submitVoucherRequest = async (req, res) => {
  try {
    const { voucherOptionId, requestedAmount, reason } = req.body;
    // Convert voucherOptionId to ObjectId if it's a string
    const voucherOptionObjectId = new mongoose.Types.ObjectId(voucherOptionId);

    // Find the resident user by their ID
    const user = await User.findById(req.user.id);
    console.log(reason)
    // Ensure the user is found and is a resident
    if (!user || user.role !== 'resident') {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Find the voucher option by ID (using the converted ObjectId)
    const voucherOption = await VoucherOption.findById(voucherOptionObjectId);
    if (!voucherOption) {
      return res.status(404).json({ message: 'Voucher option not found' });
    }

    
    // Create a new voucher request with the ObjectId
    const voucherRequest = {
      voucherOptionId: voucherOption._id, // Use the ObjectId from the VoucherOption
      requestedAmount,
      status: 'Pending',
      requestDate: new Date(),
      username: user.username,            // Add the user's username
      voucherBalance: user.voucherBalance, // Add the user's voucher balance
      userId: user._id,                   // Optionally, you can store the user's ID
    };

    // Add the voucher request to the user's voucherRequests array
    user.voucherRequests.push(voucherRequest);
    console.log(voucherRequest);

    // Create a new transaction for the voucher request
    const transaction = {
      orderId: voucherRequest._id, // Link the transaction to the voucher request ID
      itemId: voucherOption._id,   // Use the ObjectId from the VoucherOption
      itemName: voucherOption.name, // Name from VoucherOption
      quantity: 1,                 // Quantity is 1 since it's a single request
      totalPrice: requestedAmount, // Total price is the requested amount
      transactionDate: new Date(),
      isApproved: false,           // Set to false initially, pending approval
    };

    // Add the transaction to the user's transaction history
    user.transactionHistory.push(transaction);

    // Save the user record with the updated voucher request and transaction history
    await user.save();

    // Include additional user details in the response
    const response = {
      message: 'Voucher request submitted successfully',
      voucherRequest,
      transaction,
      user: {
        username: user.username,
        voucherBalance: user.voucherBalance,
        email: user.email,
        role: user.role,
        // Add any other necessary details
      },
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Controller for fetching voucher options
const getVoucherOptions = async (req, res) => {
  try {
    // Fetch all voucher options from the database
    const options = await VoucherOption.find();

    // Ensure the data is an array, although .find() should return an array by default
    if (!Array.isArray(options)) {
      return res.status(500).json({ success: false, message: 'Voucher options data is corrupted.' });
    }
    console.log(options)
    // Return the voucher options as a JSON response
    res.status(200).json({ success: true, data: options });
  } catch (error) {
    console.error('Error fetching voucher options:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch voucher options' });
  }
};


const getAuctions = async (req, res) => {
  try {
    // Find products with auction set to true
    const now = new Date(); // Current time
    const auctions = await Product.find({ auction: true });

    // Filter auctions where the auction end date has passed
    const filteredAuctions = auctions.filter((product) => new Date(product.auctionEndDate) > now);

    // Update the status of expired auctions
    await Product.updateMany(
      { auctionEndDate: { $lt: now }, auction: true },
      { $set: { auction: false } }
    );

    // Transform the response to include only product name and other necessary details
    const auctionItems = filteredAuctions.map((product) => ({
      name: product.name,
      description: product.description,
      price: product.price,
      auctionEndDate: product.auctionEndDate,
      highestBid: product.highestBid,
      highestBidder: product.highestBidder,
      imageUrl: product.imageUrl,
      category: product.category,
      id: product._id.toString(),
    }));

    res.json({ auctions: auctionItems });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
};


const placeBid = async (req, res) => {
  const { bidAmount, username} = req.body;
  const { productId } = req.params;
  // console.log(`Bid Amount: ${bidAmount}, Username: ${username}, Product ID: ${productId}`);

  if (!bidAmount || !username || !productId) {
    return res.status(400).send('Invalid bid request');
  }

  try {
    const product = await Product.findById(productId);

    if (!product || !product.auction) {
      return res.status(404).send('Auction not found for the specified product');
    }

    if (product.highestBid >= bidAmount) {
      return res.status(400).send('Bid must be higher than the current highest bid');
    }

    // Update the product with the new highest bid and bidder
    product.highestBid = bidAmount;
    product.highestBidder = username;

    await product.save();
    res.status(200).send('Bid placed successfully');
  } catch (error) {
    console.error('Error placing bid:', error);
    res.status(500).send('Server error');
  }
};



module.exports = {
    getVoucherBalance,
    getTransactionHistory,
    getProduct,
    checkout,
    resetPassword,
    markNotificationsAsRead,
    getNotifications,
    submitVoucherRequest,
    getVoucherOptions,
    getAuctions,
    placeBid
};
