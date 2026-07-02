const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/otp', require('./routes/otp'));
app.use('/api/waste', require('./routes/waste'));
app.use('/api/recyclers', require('./routes/recyclers'));

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

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'EcoSmart AI API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`EcoSmart AI backend running on http://localhost:${PORT}`);
});
