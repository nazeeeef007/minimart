const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const dotenv = require('dotenv');
dotenv.config();

// Middleware to check user's role
const checkRole = (role) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header (Bearer <token>)
            if (!token) {
                return res.status(403).json({ message: 'Access denied. No token provided.' });
            }

            // Verify the token using the JWT secret
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user by the ID in the token payload
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            // Check if the user has the correct role
            if (user.role !== role) {
                return res.status(403).json({ message: `Access denied. Required role: ${role}.` });
            }

            // Attach user info to the request object
            req.user = user;
            next();
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error' });
        }
    };
};

module.exports = { checkRole };
