const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const os = require('os');
require('dotenv').config();

const getLanIP = () => {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
};

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./modules/users/authRoutes');
const userRoutes = require('./modules/users/userRoutes');
const eventRoutes = require('./modules/events/eventRoutes');
const bookingRoutes = require('./modules/bookings/bookingRoutes');
const reviewRoutes = require('./modules/reviews/reviewRoutes');
const complaintRoutes = require('./modules/complaints/complaintRoutes');
const promoCodeRoutes = require('./modules/promoCodes/promoCodeRoutes');
const dashboardRoutes = require('./modules/users/dashboardRoutes');
const wishlistRoutes = require('./modules/events/wishlistRoutes');
const venueRoutes = require('./modules/venues/venueRoutes');
const paymentRoutes = require('./modules/payments/paymentRoutes');

// Connect to database
connectDB();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/payments', paymentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Eventify API is running', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const LAN_IP = getLanIP();

// Make LAN IP available to payment controller if BACKEND_URL not set in .env
if (!process.env.BACKEND_URL) {
  process.env.BACKEND_URL = `http://${LAN_IP}:${PORT}`;
}

app.listen(PORT, () => {
  console.log(`🚀 Eventify API Server running on port ${PORT}`);
  console.log(`📡 LAN IP: ${LAN_IP} → http://${LAN_IP}:${PORT}`);
  console.log(`💳 PayHere webview origin: http://${LAN_IP}:${PORT}`);
  console.log(`   ↳ Add this IP to PayHere Sandbox → My Account → Domain Name`);
});
