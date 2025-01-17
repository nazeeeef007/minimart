const express = require('express');
const { verifyToken, authorizeRole } = require('../middleware/AuthMiddleware');  // Middleware for verifying token and authorizing role
const { addUser, approveVoucher,   
 addProduct, removeProduct,
getInventorySummary,
getAuditLogs, approveProductRequest,
getOrders,
rejectProductRequest,
deleteProductRequest, getVoucherRequests,
approveVoucherRequest,
rejectVoucherRequest,
addVoucherOption,
toggleSuspendUser,
getUsers,
resetPassword,searchProducts, updateProduct,
deleteProduct,
createAuction,
getAllProducts
} = require('../controllers/AdminController');  // Import addUser controller function

const router = express.Router();

// Route to add a new user (admin only)
router.post('/addUser', verifyToken, authorizeRole(['admin']), addUser);
router.post('/approve-voucher', verifyToken, authorizeRole(['admin']), approveVoucher);
// Route to add product to inventory (admin only)
router.post('/addProduct', verifyToken, authorizeRole(['admin']), addProduct);
// Route to remove a product from inventory (admin only)
router.delete('/remove-product/:productId', verifyToken, authorizeRole(['admin']), removeProduct);
router.get('/inventory-summary', verifyToken, authorizeRole(['admin']), getInventorySummary);
// Route to get audit logs (admin only)
router.get('/auditLogs', verifyToken, authorizeRole(['admin']), getAuditLogs);
// Admin route to approve product request
router.post(
    '/approveProductRequest', 
    verifyToken, 
    authorizeRole(['admin']), // Ensure only admins can access this route
    approveProductRequest
);

router.post(
    '/rejectProductRequest', 
    verifyToken, 
    authorizeRole(['admin']), // Ensure only admins can access this route
    rejectProductRequest
);

router.get('/getOrders', getOrders);

router.delete(
    '/deleteProductRequest/:id', 
    verifyToken, 
    authorizeRole(['admin']), // Ensure only admins can access this route
    deleteProductRequest
);

router.post('/approveVoucherRequest', 
    verifyToken, 
    authorizeRole(['admin']), // Make sure only admin can access
    approveVoucherRequest  // Call the controller function to approve the voucher
);

router.get('/getVoucherRequests', verifyToken, authorizeRole(['admin']), getVoucherRequests); // Add this route

// Route to reject a voucher request by the admin
router.post('/rejectVoucherRequest', 
    verifyToken, 
    authorizeRole(['admin']), // Make sure only admin can access
    rejectVoucherRequest  // Call the controller function to reject the voucher
);

router.post('/addVoucherOption', verifyToken, authorizeRole(['admin']), addVoucherOption);

router.put('/toggleSuspendUser/:userId', verifyToken, authorizeRole(['admin']), toggleSuspendUser);
router.get('/getUsers' , verifyToken, authorizeRole(['admin']), getUsers);

router.put('/resetPassword/:userId', verifyToken, authorizeRole(['admin']),resetPassword);

router.get('/searchProducts', verifyToken, authorizeRole(['admin']), searchProducts);
  

router.put('/updateProduct/:productId', verifyToken, authorizeRole(['admin']), updateProduct);
router.delete('/deleteProduct/:id', verifyToken, authorizeRole(['admin']),  deleteProduct);
router.post('/createAuction',verifyToken, authorizeRole(['admin']), createAuction);
router.get('/getAllProducts', verifyToken, authorizeRole(['admin']), getAllProducts);
module.exports = router;
