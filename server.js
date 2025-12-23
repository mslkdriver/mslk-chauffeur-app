require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const rideRoutes = require('./routes/rides');

app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);

// Socket.IO pour les courses en temps réel
io.on('connection', (socket) => {
  console.log('Chauffeur connecté:', socket.id);
  
  socket.on('driver_online', (driverId) => {
    socket.join(`driver_${driverId}`);
    console.log(`Chauffeur ${driverId} en ligne`);
  });
  
  socket.on('disconnect', () => {
    console.log('Chauffeur déconnecté:', socket.id);
  });
});

app.set('io', io);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mslk-chauffeur')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur MongoDB:', err));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
