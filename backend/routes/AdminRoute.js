const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/AuthMiddleware');  // Middleware for verifying token and authorizing role
const { addUser, approveVoucher,   
 addProduct, removeProduct,
getInventorySummary,
getAuditLogs, approveProductRequest} = require('../controllers/AdminController');  // Import addUser controller function

const router = express.Router();

// Route to add a new user (admin only)
router.post('/add-user', verifyToken, authorizeRole(['admin']), addUser);
router.post('/approve-voucher', verifyToken, authorizeRole(['admin']), approveVoucher);
// Route to add product to inventory (admin only)
router.post('/add-product', verifyToken, authorizeRole(['admin']), addProduct);
// Route to remove a product from inventory (admin only)
router.delete('/remove-product/:productId', verifyToken, authorizeRole(['admin']), removeProduct);
router.get('/inventory-summary', verifyToken, authorizeRole(['admin']), getInventorySummary);
// Route to get audit logs (admin only)
router.get('/audit-logs', verifyToken, authorizeRole(['admin']), getAuditLogs);
// Admin route to approve product request
router.post(
    '/approve-product-request', 
    verifyToken, 
    authorizeRole(['admin']), // Ensure only admins can access this route
    approveProductRequest
);
module.exports = router;
