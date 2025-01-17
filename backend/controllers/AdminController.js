const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Product = require('../models/ProductModel');  // Import Product model
const AuditLog = require('../models/AuditLogModel'); // Import AuditLog model
const Order = require('../models/OrderModel');
const VoucherOption = require('../models/VoucherOptionModel');
const mongoose = require('mongoose');
dotenv.config();


const getOrders = async (req, res) => {
    const { status } = req.query;  // Optional query param to filter orders by status
  
    try {
      const query = status ? { status } : {}; // If status is provided, filter by it, otherwise get all orders
  
      // Fetch the orders from the database
      const orders = await Order.find(query)
        .populate('userId', 'username') // Populate the username field from the User collection (assumed 'username' is what you want)
        .populate('items.productId', 'name price') // Populate product details in the items array
        .sort({ date: -1 });  // Sort by most recent first
  
    //   console.log('Orders:', orders); // Log orders before sending the response
      res.status(200).json({
        success: true,
        data: orders
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  };
// Controller to add a new user (admin only)
const addUser = async (req, res) => {
  const { username, email, password, role = 'resident', voucherBalance = 0, transactionHistory = [], adminId } = req.body;

  // Validate input data
  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: 'Username, email, password, and role are required' });
  }

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role,
      voucherBalance, // Only relevant for residents
      transactionHistory, // Only relevant for residents
    });

    // Save the new user to the database
    await newUser.save();

    // Ensure req.user is populated (after successful authentication)

    // Audit log entry before sending the response
    const auditLog = new AuditLog({
      actionType: 'USER_CREATED',
      actionCategory: 'USER_MANAGEMENT',
      userId: adminId, // Admin's user ID who performed the action (can be null)
      description: `Admin created a new user: ${username} (${email}) with role: ${role}.`,
      metadata: {
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
      changeDetails: {
        before: {}, // No state before the user creation
        after: {
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          voucherBalance: newUser.voucherBalance,
          transactionHistory: newUser.transactionHistory,
        },
      },
      ipAddress: req.ip, // Capture the IP address of the admin
      sessionId: req.sessionID, // Capture the session ID if available
      status: 'SUCCESS',
    });

    // Save the audit log entry
    await auditLog.save();
    console.log("ok")
    // Return a success response
    res.status(201).json({ message: 'User created successfully', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};





const approveVoucher = async (req, res) => {
  const { userIds, voucherAmount } = req.body;
  const adminId = req.headers.adminid;
  // Validate input data
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required and must be an array' });
  }

  if (typeof voucherAmount !== 'number' || voucherAmount <= 0) {
      return res.status(400).json({ message: 'Voucher amount must be a positive number' });
  }

  try {
      // Fetch all the users to whom the voucher will be approved
      const residents = await User.find({
          _id: { $in: userIds },  // Find users by their IDs
          role: 'resident',  // Ensure only residents are included
      });

      if (residents.length === 0) {
          return res.status(404).json({ message: 'No residents found with the provided IDs' });
      }

      // Loop through each resident and update their voucher balance
      for (let resident of residents) {
          resident.voucherBalance += voucherAmount;  // Increase voucher balance by the given amount
          await resident.save();  // Save the updated resident data
      }

      // Create an audit log entry for the admin action (approving voucher)
      const auditLog = new AuditLog({
          actionType: 'VOUCHER_APPROVED',
          userId: adminId,  // Admin's user ID, assuming the admin is logged in
          description: `Admin approved a voucher of amount ${voucherAmount} for ${residents.length} residents (IDs: ${userIds.join(', ')})`,
      });

      // Save the audit log to the database
      await auditLog.save();

      // Return success response
      res.status(200).json({ message: 'Voucher approved and balances updated successfully', residents });

  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
  }
};


// Controller to add a new product to inventory (admin only)
const addProduct = async (req, res) => {
  const { name, description, price, quantity, imageUrl, category,adminId, colour, size } = req.body;

  // Validate input data
  if (!name || !description || !price || !quantity || !category) {
      return res.status(400).json({ message: 'Name, description, price, quantity, and category are required' });
  }

  // Additional validation for price and quantity
  if (typeof price !== 'number' || price <= 0) {
      return res.status(400).json({ message: 'Price must be a positive number' });
  }

  if (typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ message: 'Quantity must be a non-negative integer' });
  }

  try {
      // Check if the product already exists
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
          return res.status(400).json({ message: 'Product with this name already exists' });
      }

      // Create a new product
      const newProduct = new Product({
          name,
          description,
          price,
          quantity,
          imageUrl,  // Optional field for the product image URL
          category,
          colour,
          size
      });

      // Save the new product to the database
      await newProduct.save();

      // Prepare metadata and changeDetails for the audit log
      const metadata = {
          name: newProduct.name,
          description: newProduct.description,
          price: newProduct.price,
          quantity: newProduct.quantity,
          imageUrl: newProduct.imageUrl,
          category: newProduct.category,
          colour: newProduct.colour,
          size: newProduct.size
      };

      const changeDetails = {
          before: {}, // No state before product addition
          after: metadata
      };

      // Log the action in the audit logs
      const auditLog = new AuditLog({
          actionType: 'PRODUCT_ADDED',
          actionCategory: 'PRODUCT_MANAGEMENT',  // This is the category for product-related actions
          userId: adminId,  // Admin ID performing the action
          description: `Added product: ${name}, Category: ${category}`,
          metadata: metadata,  // Metadata about the product
          changeDetails: changeDetails,  // Details of changes
          ipAddress: req.ip,  // Admin's IP address
          sessionId: req.sessionID,  // Session ID associated with the admin's session
          status: 'SUCCESS',  // Set to success if the operation is successful
      });

      // Save the audit log entry
      await auditLog.save();

      // Return a success response
      res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error, could not add product' });
  }
};


// Controller to remove a product from inventory (admin only)
const removeProduct = async (req, res) => {
    const { productId } = req.params; // Extract product ID from URL parameters
    const adminId = req.headers.adminid;
    try {
        // Find the product by ID
        const product = await Product.findById(productId);

        // If product doesn't exist, return a 404 error
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Remove the product from the database
        await product.remove();

        // Log the action in the audit logs
        const auditLog = new AuditLog({
            actionType: 'PRODUCT_REMOVED',
            userId: adminId, // Admin ID performing the action
            description: `Removed product: ${product.name} (ID: ${product._id})`,
        });

        await auditLog.save();

        // Return a success response
        res.status(200).json({ message: 'Product removed successfully' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to get the inventory summary (admin only)
const getInventorySummary = async (req, res) => {
    try {
        // Aggregate data from the Product collection
        const summary = await Product.aggregate([
            {
                $group: {
                    _id: null, // Grouping by nothing to aggregate everything
                    totalProducts: { $sum: 1 }, // Count total number of products
                    totalQuantity: { $sum: '$quantity' }, // Sum of all quantities
                    totalValue: { $sum: { $multiply: ['$price', '$quantity'] } }, // Sum of price * quantity for each product
                },
            },
        ]);

        // If no data found, return a 404 error
        if (summary.length === 0) {
            return res.status(404).json({ message: 'No products found in inventory' });
        }

        // Return the summary data
        res.status(200).json({
            totalProducts: summary[0].totalProducts,
            totalQuantity: summary[0].totalQuantity,
            totalValue: summary[0].totalValue,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to get audit logs
const getAuditLogs = async (req, res) => {
  try {
      // Pagination and filtering options
      const { page = 1, limit = 20, search = '', status, actionType, actionCategory } = req.query;

      // Build the query based on filters
      const query = {};
      if (search) {
          query.$or = [
              { description: { $regex: search, $options: 'i' } },
              { ipAddress: { $regex: search, $options: 'i' } },
              { sessionId: { $regex: search, $options: 'i' } }
          ];
      }
      if (status) query.status = status;
      if (actionType) query.actionType = actionType;
      if (actionCategory) query.actionCategory = actionCategory;

      // Fetch the logs with pagination
      const auditLogs = await AuditLog.find(query)
          .sort({ timestamp: -1 }) // Sort by latest logs first
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .populate('userId', 'username email'); // Include user details (optional)

      // Count the total number of logs for pagination
      const totalLogs = await AuditLog.countDocuments(query);

      // Send response
      res.status(200).json({
          auditLogs,
          totalLogs,
          totalPages: Math.ceil(totalLogs / limit),
          currentPage: parseInt(page),
      });
  } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};


const approveProductRequest = async (req, res) => {
  try {
    const { orderId, userId } = req.body;
    const orderIdObject = new mongoose.Types.ObjectId(orderId);
    const adminId = req.headers.adminid;
    const ipAddress = req.ip; // Get the IP address of the admin (you can also use a more reliable method based on the client setup)
    const sessionId = req.headers.sessionid; // Assuming session ID is passed in the headers

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    // Validate orderId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'resident') {
      return res.status(403).json({ message: 'Only residents can have product requests' });
    }

    // Find the transaction in the user's history
    const transaction = user.transactionHistory.find(t => 
      t.orderId && t.orderId.toString() === orderIdObject.toString()
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Order not found in user transaction history' });
    }

    if (transaction.isApproved) {
      return res.status(400).json({ message: 'Transaction is already approved' });
    }

    // Approve the transaction
    transaction.isApproved = true;

    // Save the updated user
    await user.save();

    // Update the order status to 'Completed'
    await Order.updateOne(
      { _id: orderId, status: 'Pending' },
      { $set: { status: 'Completed' } }
    );

    // Add a detailed notification for the user
    await User.updateOne(
      { _id: userId },
      { 
        $push: { 
          notifications: {
            message: 'Your product request has been approved.',
            description: `Order ID: ${orderId}. Total price: $${transaction.totalPrice}.`,
            timestamp: new Date()
          }
        }
      }
    );

    // Create an audit log entry for the admin action (approving product request)
    const auditLog = new AuditLog({
      actionType: 'PRODUCT_REQUEST_APPROVED',
      actionCategory: 'ORDER_MANAGEMENT', // Specify the category, here we use "ORDER_MANAGEMENT"
      userId: adminId,  // Admin's user ID, assuming the admin is logged in
      description: `Admin approved the product request for Order ID: ${orderId} by Resident ID: ${userId}. Total price: $${transaction.totalPrice}`,
      metadata: {
        orderId,
        userId,
        totalPrice: transaction.totalPrice,
      },
      changeDetails: {
        before: { isApproved: false },
        after: { isApproved: true },
      },
      ipAddress: ipAddress, // The admin's IP address
      sessionId: sessionId, // The session ID
      status: 'SUCCESS', // Assuming the action was successful
    });

    // Save the audit log to the database
    await auditLog.save();

    res.status(200).json({ message: 'Product request approved successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

const rejectProductRequest = async (req, res) => {
  try {
    const { orderId, userId, description } = req.body;
    const adminId = req.headers.adminid;
    const ipAddress = req.ip; // Get the IP address of the admin
    const sessionId = req.headers.sessionid; // Assuming session ID is passed in the headers

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid order ID or user ID.' });
    }

    const user = await User.findById(userId);
    const order = await Order.findById(orderId);

    if (!user || !order) {
      return res.status(404).json({ message: 'User or order not found.' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Order has already been processed.' });
    }

    // Reimburse vouchers
    user.voucherBalance += order.totalPrice;

    // Remove order from transaction history
    user.transactionHistory = user.transactionHistory.filter(t => t.orderId && t.orderId.toString() !== orderId);

    // Add detailed notification
    user.notifications.push({
      orderId: order._id,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      totalPrice: order.totalPrice,
      message: 'Your product request has been rejected.',
      description: `The total cost of $${order.totalPrice} has been reimbursed to your voucher balance. Reason: ${description}`
    });

    // Update order status to rejected
    order.status = 'Rejected';
    order.rejectionDescription = description || null;

    await user.save();
    await order.save();

    // Create an audit log entry for the admin action (rejecting product request)
    const auditLog = new AuditLog({
      actionType: 'PRODUCT_REQUEST_REJECTED',
      actionCategory: 'ORDER_MANAGEMENT', // Specify the category
      userId: adminId,  // Admin's user ID, assuming the admin is logged in
      description: `Admin rejected the product request for Order ID: ${orderId} by Resident ID: ${userId}. Reason: ${description}`,
      metadata: {
        orderId,
        userId,
        totalPrice: order.totalPrice,
        rejectionDescription: description,
      },
      changeDetails: {
        before: { status: 'Pending', rejectionDescription: null },
        after: { status: 'Rejected', rejectionDescription: description || null },
      },
      ipAddress: ipAddress, // The admin's IP address
      sessionId: sessionId, // The session ID
      status: 'SUCCESS', // Assuming the action was successful
    });

    // Save the audit log to the database
    await auditLog.save();

    res.status(200).json({ message: 'Order rejected successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject order.' });
  }
};

const deleteProductRequest = async (req, res) => {
  try {
    const { id } = req.params; // Assuming orderId is passed as a URL parameter
    const adminId = req.headers.adminid;
    const ipAddress = req.ip; // Get the IP address of the admin
    const sessionId = req.headers.sessionid; // Assuming session ID is passed in the headers

    // Find the order by ID to ensure it exists before deleting
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Track order details before deletion for audit log
    const orderDetailsBefore = {
      orderId: order._id,
      status: order.status,
      totalPrice: order.totalPrice,
      items: order.items,
    };

    // Delete the order by ID
    await Order.findByIdAndDelete(id);

    // Create an audit log entry for the admin action (deleting a product request)
    const auditLog = new AuditLog({
      actionType: 'PRODUCT_REQUEST_DELETED',
      actionCategory: 'ORDER_MANAGEMENT', // Specify the category
      userId: adminId,  // Admin's user ID, assuming the admin is logged in
      description: `Admin deleted the product request for Order ID: ${id}.`,
      metadata: {
        orderId: id,
        orderDetails: orderDetailsBefore,
      },
      changeDetails: {
        before: orderDetailsBefore,
        after: null,  // No data after deletion
      },
      ipAddress: ipAddress, // The admin's IP address
      sessionId: sessionId, // The session ID
      status: 'SUCCESS', // Assuming the action was successful
    });

    // Save the audit log to the database
    await auditLog.save();

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete order' });
  }
};


const getVoucherRequests = async (req, res) => {
    try {
        // Find all users with 'resident' role, since they would have voucher requests
        const users = await User.find({ role: 'resident' }).select('username email voucherRequests'); // Select necessary fields

        // Filter out voucher requests that are pending approval
        let voucherRequests = [];
        users.forEach(user => {
            // Filter pending voucher requests from the 'voucherRequests' array
            const pendingRequests = user.voucherRequests.filter(voucherRequest => 
                voucherRequest.status === 'Pending'
            );
            if (pendingRequests.length > 0) {
                voucherRequests.push({
                    userId: user._id,
                    username: user.username,
                    email: user.email,
                    pendingRequests: pendingRequests
                });
            }
        });

        // If no voucher requests, return a message
        if (voucherRequests.length === 0) {
            return res.status(404).json({ success: false, message: 'No voucher requests found.' });
        }

        return res.status(200).json({
            success: true,
            data: voucherRequests,
        });
    } catch (err) {
        console.error('Error fetching voucher requests:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.',
        });
    }
};

const approveVoucherRequest = async (req, res) => {
  try {
      const { voucherRequestId } = req.body;
      const adminId = req.headers.adminid;
      // Find the resident user who made the voucher request
      const user = await User.findOne({ 'voucherRequests._id': voucherRequestId });
      if (!user) {
          return res.status(404).json({ message: 'Resident with this voucher request not found.' });
      }

      // Find the specific voucher request and update its status
      const voucherRequest = user.voucherRequests.find(req => req._id.toString() === voucherRequestId);
      if (!voucherRequest || voucherRequest.status === 'Approved') {
          return res.status(400).json({ message: 'Voucher request has already been approved or does not exist.' });
      }

      // Store the previous state for audit
      const beforeState = {
          status: voucherRequest.status,
          requestedAmount: voucherRequest.requestedAmount,
          adminNote: voucherRequest.adminNote
      };

      // Update the voucher request status to 'Approved'
      voucherRequest.status = 'Approved';
      voucherRequest.adminNote = 'Voucher request has been approved by admin.';

      // Increase the user's voucher balance by the requested amount
      user.voucherBalance += voucherRequest.requestedAmount;

      // Save the updated user document
      await user.save();

      // Store the updated state for audit
      const afterState = {
          status: voucherRequest.status,
          requestedAmount: voucherRequest.requestedAmount,
          adminNote: voucherRequest.adminNote
      };

      // Create an audit log entry
      const auditLog = new AuditLog({
          actionType: 'VOUCHER_REQUEST_APPROVED',
          actionCategory: 'VOUCHER_MANAGEMENT',
          userId: adminId,  // Admin's user ID
          description: `Admin approved voucher request ID: ${voucherRequestId} for user ID: ${user._id}.`,
          metadata: {
              voucherOptionId: voucherRequest.voucherOptionId,
              requestedAmount: voucherRequest.requestedAmount
          },
          changeDetails: {
              before: beforeState,
              after: afterState
          },
          ipAddress: req.ip, // Capture the IP address of the admin
          sessionId: req.sessionID, // Capture the session ID if available
          status: 'SUCCESS'
      });

      // Save the audit log
      await auditLog.save();

      // Create a notification for the resident
      const notification = {
          orderId: voucherRequest._id, // Assuming the voucherRequestId as the orderId
          items: [{
              name: "Voucher Request",
              quantity: 1,
              price: voucherRequest.requestedAmount
          }],
          amount: voucherRequest.requestedAmount,
          message: 'Your voucher request has been approved.',
          description: `The admin has approved your request of ${voucherRequest.requestedAmount} for the voucher: ${voucherRequest.voucherOptionId}`,
          isRead: false
      };
      
      // Add the notification to the resident's notifications array
      user.notifications.push(notification);
      await user.save();

      // Return the updated user data (including voucherRequests)
      return res.status(200).json({
          success: true,
          data: user.voucherRequests, // Send the updated voucher requests back
          message: 'Voucher request approved successfully!',
      });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error while approving voucher request.' });
  }
};




const rejectVoucherRequest = async (req, res) => {
  try {
      const { voucherRequestId, reason } = req.body;
      const adminId = req.headers.adminid;
      // Find the resident user who made the voucher request
      const user = await User.findOne({ 'voucherRequests._id': voucherRequestId });
      if (!user) {
          return res.status(404).json({ message: 'Resident with this voucher request not found.' });
      }

      // Find the specific voucher request and update its status
      const voucherRequest = user.voucherRequests.find(req => req._id.toString() === voucherRequestId);
      if (!voucherRequest || voucherRequest.status === 'Rejected') {
          return res.status(400).json({ message: 'Voucher request has already been rejected or does not exist.' });
      }

      // Store the previous state for audit
      const beforeState = {
          status: voucherRequest.status,
          requestedAmount: voucherRequest.requestedAmount,
          adminNote: voucherRequest.adminNote
      };

      // Update the voucher request status to 'Rejected'
      voucherRequest.status = 'Rejected';
      voucherRequest.adminNote = reason || 'No reason provided';

      // Save the updated user document
      await user.save();

      // Store the updated state for audit
      const afterState = {
          status: voucherRequest.status,
          requestedAmount: voucherRequest.requestedAmount,
          adminNote: voucherRequest.adminNote
      };

      // Create an audit log entry
      const auditLog = new AuditLog({
          actionType: 'VOUCHER_REQUEST_REJECTED',
          actionCategory: 'VOUCHER_MANAGEMENT',
          userId: adminId,  // Admin's user ID
          description: `Admin rejected voucher request ID: ${voucherRequestId} for user ID: ${user._id}. Reason: ${reason || 'No reason provided'}`,
          metadata: {
              voucherOptionId: voucherRequest.voucherOptionId,
              requestedAmount: voucherRequest.requestedAmount
          },
          changeDetails: {
              before: beforeState,
              after: afterState
          },
          ipAddress: req.ip, // Capture the IP address of the admin
          sessionId: req.sessionID, // Capture the session ID if available
          status: 'SUCCESS'
      });

      // Save the audit log
      await auditLog.save();

      // Create a notification for the resident
      const notification = {
          orderId: voucherRequest._id, // Assuming the voucherRequestId as the orderId
          items: [{
              name: "Voucher Request",
              quantity: 1,
              price: voucherRequest.requestedAmount
          }],
          amount: voucherRequest.requestedAmount,
          message: 'Your voucher request has been rejected.',
          description: `The admin has rejected your request of ${voucherRequest.requestedAmount} for the voucher: ${voucherRequest.voucherOptionId}. Reason: ${voucherRequest.adminNote}`,
          isRead: false
      };

      // Add the notification to the resident's notifications array
      user.notifications.push(notification);
      await user.save();

      return res.status(200).json({
          success: true,
          message: 'Voucher request rejected successfully!',
      });

  } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Server error while rejecting voucher request.' });
  }
};

  
  
// Controller to add a new voucher option
const addVoucherOption = async (req, res) => {
    try {
      const { name, description } = req.body;
      // const adminId = req.headers.adminid;
      // Validate input
      if (!name || !description) {
        return res.status(400).json({ message: 'Name and description are required' });
      }
  
      // Create and save new voucher option
      const newVoucherOption = new VoucherOption({ name, description });
      await newVoucherOption.save();
  
      res.status(201).json({
        message: 'Voucher option added successfully',
        voucherOption: newVoucherOption,
      });
    } catch (error) {
      console.error('Error adding voucher option:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  const toggleSuspendUser = async (req, res) => {
    const { userId } = req.params; // Get user ID from URL parameters
    const adminId = req.headers.adminid;
    try {
        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Store the previous state for audit
        const beforeState = {
            suspended: user.suspended
        };

        // Toggle the suspended state
        user.suspended = !user.suspended;
        await user.save();

        // Store the updated state for audit
        const afterState = {
            suspended: user.suspended
        };

        // Create an audit log entry
        const auditLog = new AuditLog({
            actionType: user.suspended ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
            actionCategory: 'USER_MANAGEMENT',
            userId: adminId,  // Admin's user ID
            description: `Admin ${user.suspended ? 'suspended' : 'unsuspended'} user ID: ${userId}.`,
            metadata: {
                username: user.username,  // Include the username or any relevant user data
                email: user.email         // You can also log the user's email
            },
            changeDetails: {
                before: beforeState,
                after: afterState
            },
            ipAddress: req.ip, // Capture the IP address of the admin
            sessionId: req.sessionID, // Capture the session ID if available
            status: 'SUCCESS'
        });

        // Save the audit log
        await auditLog.save();

        // Respond with appropriate message
        return res.status(200).json({ 
            success: true, 
            message: user.suspended ? 'User suspended successfully' : 'User unsuspended successfully' 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};



const getUsers = async (req, res) => {
    try {
      const users = await User.find();  // Fetch all users from MongoDB
      res.json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
  };


  const resetPassword = async (req, res) => {
    const { userId } = req.params; // Get user ID from URL parameters
    const newPassword = 'password123'; // Set a default password or generate one
    const adminId = req.headers.adminid;
    try {
        // Find the user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
  
        // Store the user's state before password reset for auditing
        const beforeState = {
            password: user.password  // Capture the current password (for auditing purposes)
        };

        // Update the user's password (you should hash the password before saving)
        // For simplicity, using a default password; in a real-world case, hash it!
        // user.password = await bcrypt.hash(newPassword, 10); // Uncomment if using bcrypt hashing
        user.password = newPassword;
        await user.save();
  
        // Store the updated state after password reset for auditing
        const afterState = {
            password: user.password  // This will be 'password123' or the hashed version
        };

        // Create an audit log entry
        const auditLog = new AuditLog({
            actionType: 'USER_PASSWORD_RESET',
            actionCategory: 'USER_MANAGEMENT',
            userId: adminId,  // Admin's user ID who performed the reset
            description: `Admin reset password for user ID: ${userId}.`,
            metadata: {
                username: user.username,  // Include the username or any relevant user data
                email: user.email         // You can also log the user's email
            },
            changeDetails: {
                before: beforeState,
                after: afterState
            },
            ipAddress: req.ip, // Capture the IP address of the admin
            sessionId: req.sessionID, // Capture the session ID if available
            status: 'SUCCESS'
        });

        // Save the audit log
        await auditLog.save();
  
        return res.status(200).json({ success: true, message: 'Password reset successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};


const searchProducts = async (req, res) => {
    const { name } = req.query;
    console.log('Search query received:', name); // Debug log
    try {
      const products = await Product.find({
        name: { $regex: name, $options: 'i' }, // Case-insensitive search
      }).exec();
      res.json({ products });
      console.log('Products fetched from DB:', products); // Debug log
    } catch (err) {
      console.error('Error during product search:', err); // Error log
      res.status(500).json({ message: 'Error fetching products' });
    }
  };
  

  const updateProduct = async (req, res) => {
    const { name, description, category, price, quantity} = req.body;
    const { productId } = req.params;
    const adminId = req.headers.adminid;
    
    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Store the product's state before the update for auditing
        const beforeState = {
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            quantity: product.quantity
        };

        // Update the product fields
        if (name) product.name = name;
        if (description) product.description = description;
        if (category) product.category = category;
        if (price) product.price = price;
        if (quantity) product.quantity = quantity;
  
        await product.save();

        // Store the updated state after the product update for auditing
        const afterState = {
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            quantity: product.quantity
        };

        // Create an audit log entry
        const auditLog = new AuditLog({
            actionType: 'PRODUCT_UPDATED',
            actionCategory: 'PRODUCT_MANAGEMENT',
            userId: adminId,  // Admin's user ID who performed the update
            description: `Admin updated product ID: ${productId}.`,
            metadata: {
                productId: product._id,  // Product's unique ID
                productName: product.name // Product's name for easier identification
            },
            changeDetails: {
                before: beforeState,
                after: afterState
            },
            ipAddress: req.ip, // Capture the IP address of the admin
            sessionId: req.sessionID, // Capture the session ID if available
            status: 'SUCCESS'
        });

        // Save the audit log
        await auditLog.save();
  
        return res.json({ message: 'Product updated successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error updating product' });
    }
};


const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const adminId = req.headers.adminid;
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Store the product's state before the deletion for auditing
    const beforeState = {
      name: product.name,
      description: product.description,
      category: product.category,
      price: product.price,
      quantity: product.quantity
    };

    // Delete product from the database
    await Product.findByIdAndDelete(productId);

    // Create an audit log entry
    const auditLog = new AuditLog({
      actionType: 'PRODUCT_DELETED',
      actionCategory: 'PRODUCT_MANAGEMENT',
      userId: adminId,  // Admin's user ID who performed the delete action
      description: `Admin deleted product ID: ${productId}.`,
      metadata: {
        productId: product._id,  // Product's unique ID
        productName: product.name // Product's name for easier identification
      },
      changeDetails: {
        before: beforeState,  // Store the state of the product before deletion
        after: null           // Since the product is deleted, after state is null
      },
      ipAddress: req.ip,  // Capture the IP address of the admin
      sessionId: req.sessionID,  // Capture the session ID if available
      status: 'SUCCESS'
    });

    // Save the audit log
    await auditLog.save();

    return res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error' });
  }
};

const createAuction = async (req, res) => {
  const { productName, auctionEndDate, startingBid } = req.body;
  const adminId = req.headers.adminid;
  try {
    // Ensure auctionEndDate is a valid Date object
    console.log('auctionEndDate:', auctionEndDate);
    console.log(adminId)
    const parsedAuctionEndDate = new Date(auctionEndDate);
    
    // Check if the date is invalid
    if (isNaN(parsedAuctionEndDate.getTime())) {
      return res.status(400).send('Invalid auction end date');
    }

    const product = await Product.findOne({ name: productName });
    console.log(product._id);
    if (!product) {
      return res.status(404).send('Product not found');
    }

    // Store the product's state before updating for auditing
    const beforeState = {
      name: product.name,
      description: product.description,
      price: product.price,
      auction: product.auction,
      auctionEndDate: product.auctionEndDate,
      highestBid: product.highestBid
    };

    // Update product for auction
    product.auction = true;
    product.auctionEndDate = parsedAuctionEndDate;
    product.highestBid = startingBid;

    await product.save();

    // Create an audit log entry
    const auditLog = new AuditLog({
      actionType: 'AUCTION_CREATED',
      actionCategory: 'PRODUCT_MANAGEMENT',
      userId: adminId,  // Admin's user ID who performed the action
      description: `Admin created auction for product: ${productName}.`,
      metadata: {
        productId: product._id,  // Product's unique ID
        productName: product.name // Product's name for easier identification
      },
      changeDetails: {
        before: beforeState,  // Store the state of the product before the auction update
        after: {
          auction: product.auction,
          auctionEndDate: product.auctionEndDate,
          highestBid: product.highestBid
        }
      },
      ipAddress: req.ip,  // Capture the IP address of the admin
      sessionId: req.sessionID,  // Capture the session ID if available
      status: 'SUCCESS'
    });

    // Save the audit log
    await auditLog.save();

    return res.status(200).send({
      message: 'Auction created successfully',
      productId: product._id
    });
  } catch (error) {
    console.error(error);
    return res.status(500).send('Server error');
  }
};


const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();  // Assuming you use MongoDB with Mongoose
    console.log(products)
    console.log("ok")
    res.json({ products });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products' });
  }
}

module.exports = {
    addUser,
    approveVoucher,
    addProduct,
    removeProduct,
    getInventorySummary,
    getAuditLogs,
    approveProductRequest,
    getOrders,
    rejectProductRequest,
    deleteProductRequest,
    getVoucherRequests,
    approveVoucherRequest,
    rejectVoucherRequest,
    addVoucherOption,
    toggleSuspendUser,
    getUsers,
    resetPassword,
    searchProducts,
    updateProduct,
    deleteProduct,
    createAuction,
    getAllProducts

};
