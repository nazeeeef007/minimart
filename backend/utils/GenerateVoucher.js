const crypto = require('crypto');
require('dotenv').config();  // Make sure dotenv is loaded

function generateVoucherId() {
    const voucherCode = 'VALID-VOUCHER-CODE';  // Use your voucher code

    // Get the private key from the environment variables
    const privateKey = process.env.PRIVATE_KEY;

    if (!privateKey) {
        throw new Error("Private key is not defined in the environment.");
    }

    // Create a signer to sign the voucher code using RSA
    const sign = crypto.createSign('SHA256');
    sign.update(voucherCode);
    const signature = sign.sign(privateKey, 'hex');

    // Return the combined voucherId (voucherCode.signature)
    const voucherId = `${voucherCode}.${signature}`;
    return voucherId;
}

// Example usage
const voucherId = generateVoucherId();
console.log('Generated Voucher ID:', voucherId);
