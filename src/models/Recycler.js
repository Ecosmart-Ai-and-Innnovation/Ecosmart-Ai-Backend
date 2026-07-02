const mongoose = require('mongoose');

const recyclerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  distance: { type: String, required: true },
  wasteTypes: { type: [String], required: true },
  price: { type: String, required: true },
  phone: { type: String, required: true },
  chatNumber: { type: String, required: true },
  rating: { type: String, required: true },
  verified: { type: Boolean, default: true },
  state: { type: String, required: true },
  address: { type: String, required: true },
  mapQuery: { type: String, required: true },
  hours: { type: String, default: 'Open 6am - Close 5pm' },
});

module.exports = mongoose.model('Recycler', recyclerSchema);
