require('dotenv').config();
const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const PORT = process.env.PORT || 3000;

// Créer le serveur HTTP
const server = http.createServer(app);

// Initialiser Socket.IO
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Nouveau chauffeur connecté:', socket.id);

  // Chauffeur en ligne
  socket.on('driver_online', (driverId) => {
    console.log('Chauffeur en ligne:', driverId);
    socket.join(`driver_${driverId}`);
  });

  // Déconnexion
  socket.on('disconnect', () => {
    console.log('Chauffeur déconnecté:', socket.id);
  });
});

// Rendre io accessible dans l'app
app.set('io', io);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mslk-chauffeur')
  .then(() => console.log('MongoDB connecté'))
  .catch(err => console.error('Erreur MongoDB:', err));

// Démarrer le serveur
server.listen(PORT, () => {
  console.log(`🚀 Serveur MSLK Chauffeur démarré sur le port ${PORT}`);
  console.log(`📍 Environnement: ${process.env.NODE_ENV || 'development'}`);
});
