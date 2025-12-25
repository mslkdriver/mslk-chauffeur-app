const express = require('express');
const cors = require('cors');

const app = express();
// Force cache refresh

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);


module.exports = app;
