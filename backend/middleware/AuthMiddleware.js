const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// Middleware to verify JWT and extract user
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from Authorization header (Bearer <token>)
  // console.log('Verifying token...');
  if (!token) {
    // console.log("ok")
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
    // console.log("ok")
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Invalid token.' });
  }
};

// Middleware to authorize based on role
// Middleware to authorize based on role and check if user is suspended
const authorizeRole = (roles) => {
  return async (req, res, next) => {
    try {
      // console.log('Authorizing role...');
      const user = await User.findById(req.user.id); // Use user ID from decoded token
      if (!user) return res.status(404).json({ message: 'User not found.' });

      // Check if user is suspended
      if (user.suspended) {
        return res.status(403).json({ message: 'Access denied. Your account is suspended.' });
      }

      // Check if user has a valid role
      if (!roles.includes(user.role)) {
        return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
      }

      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error.' });
    }
  };
};

module.exports = { verifyToken, authorizeRole };
