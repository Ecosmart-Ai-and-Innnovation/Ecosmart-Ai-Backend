const mongoose = require('mongoose');
require('dotenv').config();

const Recycler = require('./src/models/Recycler');

const recyclers = [
  // Abuja
  {
    name: 'GreenCycle Center',
    distance: '0.8km away',
    wasteTypes: ['Plastic', 'Metal', 'Paper'],
    price: '₦50 – ₦150/kg',
    phone: '+234 802 123 4567',
    chatNumber: '+234 802 123 4567',
    rating: '4.8',
    verified: true,
    state: 'Abuja',
    address: 'Plot 156 Industrial Raw Bld, Wuse Zone 3, Abuja',
    mapQuery: 'Abuja,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
  {
    name: 'EcoHub Recycler',
    distance: '1.2km away',
    wasteTypes: ['Plastic', 'Aluminium', 'Cables'],
    price: '₦60 – ₦170/kg',
    phone: '+234 803 456 7890',
    chatNumber: '+234 803 456 7890',
    rating: '4.7',
    verified: true,
    state: 'Abuja',
    address: 'Plot 156 Industrial Raw Bld, Wuse Zone 3, Abuja',
    mapQuery: 'Abuja,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
  {
    name: 'Clean Earth Point',
    distance: '1.6km away',
    wasteTypes: ['Metal', 'Paper', 'Plastic'],
    price: '₦55 – ₦160/kg',
    phone: '+234 805 111 2233',
    chatNumber: '+234 805 111 2233',
    rating: '4.6',
    verified: true,
    state: 'Abuja',
    address: 'Plot 156 Industrial Raw Bld, Wuse Zone 3, Abuja',
    mapQuery: 'Abuja,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
  // Lagos
  {
    name: 'Lagos Green Hub',
    distance: '1.0km away',
    wasteTypes: ['Plastic', 'Glass', 'Paper'],
    price: '₦45 – ₦130/kg',
    phone: '+234 806 789 0123',
    chatNumber: '+234 806 789 0123',
    rating: '4.5',
    verified: true,
    state: 'Lagos',
    address: '12 Acme Road, Ikeja, Lagos',
    mapQuery: 'Ikeja,Lagos,Nigeria',
    hours: 'Open 7am - Close 6pm',
  },
  {
    name: 'EcoCycle Lagos',
    distance: '2.3km away',
    wasteTypes: ['Metal', 'E-Waste', 'Plastic'],
    price: '₦70 – ₦200/kg',
    phone: '+234 807 654 3210',
    chatNumber: '+234 807 654 3210',
    rating: '4.9',
    verified: true,
    state: 'Lagos',
    address: '12 Acme Road, Ikeja, Lagos',
    mapQuery: 'Ikeja,Lagos,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
  // Enugu
  {
    name: 'Enugu Waste Solutions',
    distance: '0.5km away',
    wasteTypes: ['Plastic', 'Paper', 'Organic'],
    price: '₦40 – ₦120/kg',
    phone: '+234 808 222 3344',
    chatNumber: '+234 808 222 3344',
    rating: '4.4',
    verified: true,
    state: 'Enugu',
    address: '7 Ogui Road, Enugu, Nigeria',
    mapQuery: 'Enugu,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
  // Rivers
  {
    name: 'Port Harcourt Recyclers',
    distance: '1.5km away',
    wasteTypes: ['Metal', 'Plastic', 'Glass'],
    price: '₦55 – ₦150/kg',
    phone: '+234 809 333 4455',
    chatNumber: '+234 809 333 4455',
    rating: '4.6',
    verified: true,
    state: 'Rivers',
    address: '22 Aba Road, Port Harcourt, Rivers',
    mapQuery: 'Port Harcourt,Rivers,Nigeria',
    hours: 'Open 7am - Close 6pm',
  },
  // Kano
  {
    name: 'Kano Recycling Center',
    distance: '2.0km away',
    wasteTypes: ['Plastic', 'Metal', 'Paper'],
    price: '₦35 – ₦100/kg',
    phone: '+234 810 444 5566',
    chatNumber: '+234 810 444 5566',
    rating: '4.3',
    verified: true,
    state: 'Kano',
    address: '18 Zaria Road, Kano, Nigeria',
    mapQuery: 'Kano,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
  // Oyo
  {
    name: 'Ibadan Eco Point',
    distance: '1.8km away',
    wasteTypes: ['Paper', 'Plastic', 'Organic'],
    price: '₦30 – ₦90/kg',
    phone: '+234 811 555 6677',
    chatNumber: '+234 811 555 6677',
    rating: '4.2',
    verified: true,
    state: 'Oyo',
    address: '14 Ring Road, Ibadan, Oyo, Nigeria',
    mapQuery: 'Ibadan,Oyo,Nigeria',
    hours: 'Open 6am - Close 5pm',
  },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');

    await Recycler.deleteMany({});
    console.log('Cleared existing recyclers');

    await Recycler.insertMany(recyclers);
    console.log(`Seeded ${recyclers.length} recyclers`);

    await mongoose.disconnect();
    console.log('Done. MongoDB disconnected.');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
