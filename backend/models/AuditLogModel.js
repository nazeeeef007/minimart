const mongoose = require('mongoose');

// Audit log schema
const auditLogSchema = new mongoose.Schema({
    actionType: {
        type: String, // e.g., "USER_CREATED", "PRODUCT_ADDED", etc.
        required: true,
    },
    actionCategory: {
        type: String, // e.g., "USER_MANAGEMENT", "PRODUCT_MANAGEMENT", "ORDER_MANAGEMENT"
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the admin user who performed the action
        required: true,
    },
    description: {
        type: String, // A brief description of the action
        required: true,
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed, // For storing additional data specific to the action (e.g., product details, changes)
        default: {},
    },
    changeDetails: {
        before: mongoose.Schema.Types.Mixed, // State before the action (optional)
        after: mongoose.Schema.Types.Mixed,  // State after the action (optional)
    },
    ipAddress: {
        type: String, // IP address of the admin who performed the action
    },
    sessionId: {
        type: String, // Session ID associated with the admin's login
    },
    status: {
        type: String, // e.g., "SUCCESS", "FAILURE"
        default: "SUCCESS",
    },
    timestamp: {
        type: Date,
        default: Date.now, // Automatically set timestamp for when the action occurred
    },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
