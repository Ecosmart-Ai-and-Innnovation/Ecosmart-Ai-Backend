const mongoose = require('mongoose');

const wasteScanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wasteType: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['plastic', 'paper', 'metal', 'glass', 'organic', 'ewaste', 'rubber', 'unknown'],
      required: true,
    },
    recyclable: {
      type: Boolean,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    estimatedValue: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: 'NGN' },
    },
    disposalGuidance: {
      type: String,
      default: '',
    },
    ecoTip: {
      type: String,
      default: '',
    },
    imageBase64: {
      type: String,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WasteScan', wasteScanSchema);
