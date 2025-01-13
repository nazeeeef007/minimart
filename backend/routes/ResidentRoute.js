const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/AuthMiddleware'); // Use middleware for role-based access
const { getVoucherBalance,
    getTransactionHistory,getProduct,
    checkout,
    resetPassword } = require('../controllers/ResidentController'); // Import the controller for resident operations

const router = express.Router();

router.post('/checkout', verifyToken, authorizeRole(['resident']), checkout);
// Route to get the resident's voucher balance
router.get('/vouchers', verifyToken, authorizeRole(['resident']), getVoucherBalance);

// Route for a resident to view their transaction history
router.get('/transactions', verifyToken, authorizeRole(['resident']), getTransactionHistory);

// Route for an admin to view any resident's transaction history
// router.get('/admin/transactions/:userId', verifyToken, authorizeRole(['admin']), getResidentTransactionHistory);

// Route for a resident to add a new transaction to their history
router.post('/reset-password', verifyToken, authorizeRole(['resident']), resetPassword);

// Route for a resident to get a product by id
router.get('/product', verifyToken, authorizeRole(['resident']), getProduct);

// Route for a resident to buy a product
// router.post('/buy-product', verifyToken, authorizeRole(['resident']), requestProduct);

// // Route for a resident to preorder an out-of-stock product
// router.post('/preorder-product', verifyToken, authorizeRole(['resident']), preorderProduct);



module.exports = router;
