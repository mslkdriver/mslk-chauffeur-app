const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

// Route de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'API MSLK Chauffeur',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      rides: '/api/rides'
    }
  });
});

module.exports = app;
