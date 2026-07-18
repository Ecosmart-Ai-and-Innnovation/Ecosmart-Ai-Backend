const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    // Allow all origins for hackathon demo
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json({ limit: '15mb' })); // //Ese's fix — headroom for base64 image overhead (~37% inflation)

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/waste', require('./routes/waste'));
app.use('/api/recyclers', require('./routes/recyclers'));
app.use('/api/recycler-profile', require('./routes/recycler-profile'));

// Dashboard summary
app.get('/api/dashboard', require('./middleware/auth'), async (req, res) => {
  try {
    const WasteScan = require('./models/WasteScan');
    const scans = await WasteScan.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(10);

    const totalEarnings = scans
      .filter((s) => s.recyclable)
      .reduce((sum, s) => sum + ((s.estimatedValue?.min || 0) + (s.estimatedValue?.max || 0)) / 2, 0);

    res.json({
      success: true,
      data: {
        user: { name: req.user.name },
        stats: {
          totalEarnings: Math.round(totalEarnings),
          itemsScanned: scans.length,
        },
        recentActivity: scans.map((s) => ({
          id: s._id,
          item: s.wasteType,
          amount: Math.round(((s.estimatedValue?.min || 0) + (s.estimatedValue?.max || 0)) / 2),
          status: s.recyclable ? 'Recycled' : 'Pending',
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Recycler Dashboard summary
app.get('/api/dashboard/recycler', require('./middleware/auth'), async (req, res) => {
  try {
    const User = require('./models/User');
    const Recycler = require('./models/Recycler');

    const user = await User.findById(req.user._id);

    const recyclerProfile = await Recycler.findOne({ userId: req.user._id });
    const listingCount = recyclerProfile?.categories?.length || 0;

    res.json({
      success: true,
      data: {
        user: {
          businessName: user?.name || recyclerProfile?.businessName || 'Recycler',
          isOnline: recyclerProfile?.availableNow || false,
          dateString: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
        },
        wallet: {
          balance: 0,
          todayPayments: 0,
          weekPurchases: 0,
          pendingSettlements: 0,
        },
        stats: {
          activeListings: listingCount,
          avgRating: Math.round((recyclerProfile?.rating || 4.5) * 10) / 10,
          totalKgCollected: recyclerProfile?.totalKgCollected || 0,
          ecoPoints: recyclerProfile?.ecoPoints || 0,
        },
        requests: [],
        activities: [],
        ecoImpact: {
          wasteRecycledKg: recyclerProfile?.totalKgCollected || 0,
          co2ReducedKg: Math.round((recyclerProfile?.totalKgCollected || 0) * 0.6),
          individualsRewarded: recyclerProfile?.individualsRewarded || 0,
          communitiesServed: recyclerProfile?.communitiesServed || 1,
        },
      },
    });
  } catch (error) {
    console.error('Recycler dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EcoSmart AI API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EcoSmart AI backend running on http://localhost:${PORT}`);
});
