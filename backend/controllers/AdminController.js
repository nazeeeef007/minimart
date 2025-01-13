const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const Product = require('../models/ProductModel');  // Import Product model
const AuditLog = require('../models/AuditLogModel'); // Import AuditLog model
dotenv.config();

// Controller to add a new user (admin only)
const addUser = async (req, res) => {
    const { username, email, password, role = 'resident', voucherBalance = 0, transactionHistory = [] } = req.body;

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
            voucherBalance,  // Only relevant for residents
            transactionHistory  // Only relevant for residents
        });

        // Save the new user to the database
        await newUser.save();

        // Log the action in the audit logs
        const auditLog = new AuditLog({
            actionType: 'USER_CREATED',
            userId: req.user.id, // Admin ID performing the action
            description: `Created new user: ${newUser.username}, Role: ${newUser.role}, Email: ${newUser.email}`,
        });

        await auditLog.save();

        // Return a success response
        res.status(201).json({ message: 'User created successfully', user: newUser });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Controller to approve voucher for selected residents (admin only)
const approveVoucher = async (req, res) => {
    const { userIds, voucherAmount } = req.body;

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

        // Log the action in the audit logs
        const auditLog = new AuditLog({
            actionType: 'VOUCHER_APPROVED',
            userId: req.user.id, // Admin ID performing the action
            description: `Approved voucher of ${voucherAmount} for residents: ${residents.map(r => r.username).join(', ')}`,
        });

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
    const { name, description, price, quantity, imageUrl, category } = req.body;

    // Validate input data
    if (!name || !description || !price || !quantity || !category) {
        return res.status(400).json({ message: 'Name, description, price, quantity, and category are required' });
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
            category
        });

        // Save the new product to the database
        await newProduct.save();

         // Log the action in audit logs
        const auditLog = new AuditLog({
            actionType: 'PRODUCT_ADDED',
            userId: req.user.id, // Admin ID performing the action
            description: `Added product: ${name}, ${category}`,
        });

        await auditLog.save();
        // Return a success response
        res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to remove a product from inventory (admin only)
const removeProduct = async (req, res) => {
    const { productId } = req.params; // Extract product ID from URL parameters

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
            userId: req.user.id, // Admin ID performing the action
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
        // Find all audit logs, sorted by the most recent first
        const logs = await AuditLog.find().populate('userId', 'username email').sort({ timestamp: -1 });

        if (logs.length === 0) {
            return res.status(404).json({ message: 'No audit logs found.' });
        }

        res.status(200).json(logs);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to approve product request (admin only)
const approveProductRequest = async (req, res) => {
    const { userId, transactionId } = req.body;  // Expecting userId and transactionId from the request body

    try {
        // Fetch the user from the database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Find the specific transaction in the user's history
        const transaction = user.transactionHistory.id(transactionId);
        if (!transaction || transaction.isApproved) {
            return res.status(400).json({ message: 'Transaction not found or already approved' });
        }

        // Fetch the product from the database
        const product = await Product.findById(transaction.itemId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Check if the product has enough stock
        if (product.quantity < transaction.quantity) {
            return res.status(400).json({ message: 'Not enough stock available' });
        }

        // Calculate the total cost of the product request
        const totalCost = product.price * transaction.quantity;

        // Check if the user has enough voucher balance
        if (user.voucherBalance < totalCost) {
            return res.status(400).json({ message: 'User does not have enough voucher balance' });
        }

        // Deduct the total cost from the user's voucher balance
        user.voucherBalance -= totalCost;

        // Update the product stock
        product.quantity -= transaction.quantity;

        // Mark the transaction as approved
        transaction.isApproved = true;

        // Save the updated user and product data
        await user.save();
        await product.save();


        // Log the action in audit logs
        const auditLog = new AuditLog({
            actionType: 'Approve Product Request',
            userId: req.user.id, // Admin ID performing the action
            description: `Approved product request for ${user.username} (ID: ${user._id}) requesting ${transaction.quantity} of ${product.name} (ID: ${product._id})`,
        });

        await auditLog.save();

        // Return success response
        res.status(200).json({
            message: 'Product request approved successfully',
            updatedVoucherBalance: user.voucherBalance,
            updatedProductQuantity: product.quantity,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    addUser,
    approveVoucher,
    addProduct,
    removeProduct,
    getInventorySummary,
    getAuditLogs,
    approveProductRequest
};
