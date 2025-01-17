const User = require('../models/UserModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Signup Controller
const signup = async (req, res) => {
    const { email, username, password, imageUrl, role } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Email or Username already exists' });
        }
         
        // Create new user
        const user = new User({
            email,
            username,
            password,
            imageUrl,
            role
        });

        // Save user to the database
        await user.save();

        // Return success message
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Define login controller similarly
const login = async (req, res) => {
    const { username, password } = req.body;

    try {
        // Find user by username
        const user = await User.findOne({ username });
        console.log(user?.password);
        if (!user) {
            return res.status(400).json({ message: 'Invalid username' });
        }

        // Check if the user is suspended
        if (user.suspended) {
            return res.status(403).json({ message: 'Your account is suspended. Please contact support.' });
        }

        // Compare passwords
        const isMatch = await user.comparePassword(password);
        console.log(isMatch, username, password);
        if (!isMatch) {
            console.log('Invalid password');
            return res.status(400).json({ message: 'Invalid password' });
        }

        // Generate JWT token
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Return token and role
        res.status(200).json({
            message: 'Login successful',
            token,
            role: user.role,  // Send the user's role in the response
            userId: user._id,  // Send the user's ID in the response
            username: username
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const logout = async (req, res) => {
    try {
        // Clear any cookies or tokens
        res.clearCookie('token'); // Assuming you're using cookies to store the token
        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during logout' });
    }
};


module.exports = { signup, login, logout };

