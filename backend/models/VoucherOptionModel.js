// models/VoucherOption.js
const mongoose = require('mongoose');

const voucherOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  }
});

module.exports = mongoose.model('VoucherOption', voucherOptionSchema);
