const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// ── Save/Update Recycler Profile ──
router.post('/save', auth, async (req, res) => {
  try {
    const {
      operationSize,
      businessName,
      description,
      whatsapp,
      address,
      city,
      state,
      coverageAreas,
      selectedDays,
      openTime,
      closeTime,
      availableNow,
      selectedMaterials,
      selectedMethods,
      sameDayPickup,
      scheduledBookings,
      minQuantity,
      negotiateAll,
      prices,
      paymentMethods,
      minPickupValue,
      minCollectionQty,
      photoBase64,
    } = req.body;

    // Update the user document with recycler profile data
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'recyclerProfile.operationSize': operationSize || '',
          'recyclerProfile.businessName': businessName || '',
          'recyclerProfile.description': description || '',
          'recyclerProfile.whatsapp': whatsapp || '',
          'recyclerProfile.address': address || '',
          'recyclerProfile.city': city || '',
          'recyclerProfile.state': state || '',
          'recyclerProfile.coverageAreas': coverageAreas || [],
          'recyclerProfile.selectedDays': selectedDays || [],
          'recyclerProfile.openTime': openTime || '',
          'recyclerProfile.closeTime': closeTime || '',
          'recyclerProfile.availableNow': availableNow || false,
          'recyclerProfile.selectedMaterials': selectedMaterials || [],
          'recyclerProfile.selectedMethods': selectedMethods || [],
          'recyclerProfile.sameDayPickup': sameDayPickup || false,
          'recyclerProfile.scheduledBookings': scheduledBookings || false,
          'recyclerProfile.minQuantity': minQuantity || '',
          'recyclerProfile.negotiateAll': negotiateAll || false,
          'recyclerProfile.prices': prices || {},
          'recyclerProfile.paymentMethods': paymentMethods || [],
          'recyclerProfile.minPickupValue': minPickupValue || '',
          'recyclerProfile.minCollectionQty': minCollectionQty || '',
          'recyclerProfile.photoBase64': photoBase64 || '',
          'recyclerProfile.profileComplete': true,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Recycler profile saved successfully',
      data: { profileComplete: true },
    });
  } catch (error) {
    console.error('Save recycler profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ── Get Recycler Profile ──
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(400).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user.recyclerProfile || {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
