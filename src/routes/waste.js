const express = require('express');
const auth = require('../middleware/auth');
const WasteScan = require('../models/WasteScan');
const { classifyWaste } = require('../services/gemini');

const router = express.Router();

// ── Scan Waste (image or text) ──
router.post('/scan', auth, async (req, res) => {
  try {
    const { imageBase64, text } = req.body;

    if (!imageBase64 && !text) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an image or waste type text',
      });
    }

    // Call Gemini Vision to classify
    const result = await classifyWaste(imageBase64, text);

    // Save scan to database
    const scan = await WasteScan.create({
      userId: req.user._id,
      wasteType: result.wasteType || text || 'Unknown',
      category: result.category || 'unknown',
      recyclable: result.recyclable ?? false,
      confidence: result.confidence ?? 0,
      estimatedValue: result.estimatedValue || { min: 0, max: 0, currency: 'NGN' },
      disposalGuidance: result.disposalGuidance || '',
      ecoTip: result.ecoTip || '',
      imageBase64: imageBase64 || null,
    });

    res.json({
      success: true,
      data: {
        _id: scan._id,
        wasteType: scan.wasteType,
        category: scan.category,
        recyclable: scan.recyclable,
        confidence: scan.confidence,
        estimatedValue: scan.estimatedValue,
        disposalGuidance: scan.disposalGuidance,
        ecoTip: scan.ecoTip,
        createdAt: scan.createdAt,
      },
    });
  } catch (error) {
    console.error('Scan error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze waste item',
    });
  }
});

// ── Get Scan History ──
router.get('/history', auth, async (req, res) => {
  try {
    const scans = await WasteScan.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: scans.map((s) => ({
        _id: s._id,
        wasteType: s.wasteType,
        category: s.category,
        recyclable: s.recyclable,
        confidence: s.confidence,
        estimatedValue: s.estimatedValue,
        disposalGuidance: s.disposalGuidance,
        ecoTip: s.ecoTip,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Get Single Scan ──
router.get('/history/:id', auth, async (req, res) => {
  try {
    const scan = await WasteScan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!scan) {
      return res.status(404).json({ success: false, message: 'Scan not found' });
    }

    res.json({ success: true, data: scan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
