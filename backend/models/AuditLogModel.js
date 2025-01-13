const mongoose = require('mongoose');

// Audit log schema
const auditLogSchema = new mongoose.Schema({
    actionType: {
        type: String, // e.g., "USER_CREATED", "PRODUCT_ADDED", etc.
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the user who performed the action
        required: true,
    },
    description: {
        type: String, // Description of the action
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now, // Automatically set timestamp for when the action occurred
    },
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
