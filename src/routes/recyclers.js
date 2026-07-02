const express = require('express');
const Recycler = require('../models/Recycler');

const router = express.Router();

// ── Get All Recyclers ──
router.get('/', async (req, res) => {
  try {
    const { state } = req.query;
    const filter = state ? { state: { $regex: new RegExp(state, 'i') } } : {};
    const recyclers = await Recycler.find(filter);

    res.json({ success: true, data: recyclers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Get Single Recycler ──
router.get('/:id', async (req, res) => {
  try {
    const recycler = await Recycler.findById(req.params.id);
    if (!recycler) {
      return res.status(404).json({ success: false, message: 'Recycler not found' });
    }
    res.json({ success: true, data: recycler });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
