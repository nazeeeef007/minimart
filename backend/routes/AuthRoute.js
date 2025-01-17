const express = require('express');
const { signup, login, logout} = require('../controllers/AuthController');
const { verifyToken, authorizeRole } = require('../middleware/AuthMiddleware');
const { checkRole } = require('../middleware/CheckRole'); // New role-checking middleware

const router = express.Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes for residents
router.get('/resident/dashboard', 
  verifyToken, 
  authorizeRole(['resident']), // Ensure user is a 'resident'
  checkRole('resident'), // Additional role check (if needed)
  (req, res) => {
    res.json({ message: 'Welcome to the resident dashboard.' });
  });

// Protected routes for admins
router.get('/admin/manage-users', 
  verifyToken, 
  authorizeRole(['admin']), 
  checkRole('admin'), // Optional role check for admin
  (req, res) => {
    res.json({ message: 'Welcome to the admin panel.' });
  });

module.exports = router;


// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODI3ZDE3N2NiNTU3MTYzZTg0NGRhOSIsImlhdCI6MTczNjYwNDk1MSwiZXhwIjoxNzM2NjA4NTUxfQ.0eQVlehBBHk3GqxKHNIBe9cwSRRUXXrg-xpco5MGYTg"
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ODI3ZDE3N2NiNTU3MTYzZTg0NGRhOSIsImlhdCI6MTczNjYwNTAwMCwiZXhwIjoxNzM2NjA4NjAwfQ.TpUZS1EzU0NvgnWu0cNNko4LuLsC4f_7VrP-TT1_idk"