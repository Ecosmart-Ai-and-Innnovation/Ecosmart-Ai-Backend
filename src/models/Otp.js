const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  identifier: {
    type: String,
    required: true,
    trim: true,
  },
  method: {
    type: String,
    enum: ['email', 'phone'],
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  purpose: {
    type: String,
    enum: ['password-reset', 'email-verification'],
    default: 'password-reset',
  },
}, { timestamps: true });

// Index to auto-expire documents after expiry
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static: generate a 6-digit OTP
otpSchema.statics.generate = function () {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

module.exports = mongoose.model('Otp', otpSchema);
