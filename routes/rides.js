const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const Driver = require('../models/Driver');
const { authMiddleware } = require('./auth');

// Obtenir les courses disponibles (en attente)
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({ 
      statut: 'en_attente'
    }).sort({ dateCreation: -1 });
    
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir les courses du chauffeur
router.get('/my-rides', authMiddleware, async (req, res) => {
  try {
    const rides = await Ride.find({ 
      chauffeur: req.driverId 
    }).sort({ dateCreation: -1 });
    
    res.json(rides);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Obtenir une course spécifique
router.get('/:rideId', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId).populate('chauffeur', 'nom prenom telephone');
    
    if (!ride) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    res.json(ride);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Accepter une course
router.post('/:rideId/accept', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    
    if (!ride) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    if (ride.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Cette course n\'est plus disponible' });
    }
    
    // Mettre à jour la course
    ride.chauffeur = req.driverId;
    ride.statut = 'acceptee';
    ride.dateAcceptation = new Date();
    await ride.save();
    
    // Mettre à jour le statut du chauffeur
    await Driver.findByIdAndUpdate(req.driverId, { statut: 'en_course' });
    
    // Envoyer notification via Socket.IO
    const io = req.app.get('io');
    io.to(`driver_${req.driverId}`).emit('ride_accepted', ride);
    
    res.json({
      message: 'Course acceptée',
      ride
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Démarrer une course
router.post('/:rideId/start', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      chauffeur: req.driverId
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    if (ride.statut !== 'acceptee') {
      return res.status(400).json({ message: 'Cette course ne peut pas être démarrée' });
    }
    
    ride.statut = 'en_cours';
    ride.dateDebut = new Date();
    await ride.save();
    
    // Notification Socket.IO
    const io = req.app.get('io');
    io.to(`driver_${req.driverId}`).emit('ride_started', ride);
    
    res.json({
      message: 'Course démarrée',
      ride
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Terminer une course
router.post('/:rideId/complete', authMiddleware, async (req, res) => {
  try {
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      chauffeur: req.driverId
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    if (ride.statut !== 'en_cours') {
      return res.status(400).json({ message: 'Cette course n\'est pas en cours' });
    }
    
    ride.statut = 'terminee';
    ride.dateFin = new Date();
    await ride.save();
    
    // Mettre à jour les statistiques du chauffeur
    await Driver.findByIdAndUpdate(req.driverId, {
      $inc: { nombreCourses: 1 },
      statut: 'disponible'
    });
    
    // Notification Socket.IO
    const io = req.app.get('io');
    io.to(`driver_${req.driverId}`).emit('ride_completed', ride);
    
    res.json({
      message: 'Course terminée',
      ride
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Annuler une course
router.post('/:rideId/cancel', authMiddleware, async (req, res) => {
  try {
    const { raison } = req.body;
    const ride = await Ride.findOne({
      _id: req.params.rideId,
      chauffeur: req.driverId
    });
    
    if (!ride) {
      return res.status(404).json({ message: 'Course non trouvée' });
    }
    
    if (ride.statut === 'terminee' || ride.statut === 'annulee') {
      return res.status(400).json({ message: 'Cette course ne peut pas être annulée' });
    }
    
    ride.statut = 'annulee';
    ride.commentaire = raison || 'Annulée par le chauffeur';
    await ride.save();
    
    // Mettre à jour le statut du chauffeur
    await Driver.findByIdAndUpdate(req.driverId, { statut: 'disponible' });
    
    // Notification Socket.IO
    const io = req.app.get('io');
    io.to(`driver_${req.driverId}`).emit('ride_cancelled', ride);
    
    res.json({
      message: 'Course annulée',
      ride
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
