const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// Middleware to verify JWT and extract user
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header (Bearer <token>)
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Decode the token

    // Attach decoded data to the request object (e.g., user ID and role)
    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    // console.log('User ID:', req.user.id); // Optionally log the user ID for debugging

    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Middleware to authorize based on role
const authorizeRole = (roles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.id); // Use user ID from decoded token
      if (!user) return res.status(404).json({ message: 'User not found.' });

      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }
      next();
    } catch (error) {
      res.status(500).json({ message: 'Server error.' });
    }
  };
};

module.exports = { verifyToken, authorizeRole };
