const mongoose = require('mongoose');
const crypto = require('crypto');

const passwordResetTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tokenHash: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true });

// Automatically remove expired tokens
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Generate a random token and return it with the hash stored
passwordResetTokenSchema.statics.generate = async function (userId) {
  // Invalidate any existing tokens for this user
  await this.deleteMany({ userId });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await this.create({
    userId,
    tokenHash,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
  });

  return rawToken;
};

// Verify a raw token against stored hashes
passwordResetTokenSchema.statics.verify = async function (rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const doc = await this.findOne({ tokenHash });
  if (!doc) return null;
  if (doc.expiresAt < new Date()) {
    await doc.deleteOne();
    return null;
  }
  return doc;
};

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
