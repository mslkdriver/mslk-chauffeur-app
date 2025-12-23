const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

// Inscription d'un nouveau chauffeur
router.post('/register', async (req, res) => {
  try {
    const { nom, prenom, email, telephone, password, numeroPermis, vehicule } = req.body;
    
    // Vérifier si le chauffeur existe déjà
    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Créer un nouveau chauffeur
    const driver = new Driver({
      nom,
      prenom,
      email,
      telephone,
      password,
      numeroPermis,
      vehicule
    });
    
    await driver.save();
    
    // Générer un token JWT
    const token = jwt.sign(
      { driverId: driver._id },
      process.env.JWT_SECRET || 'mslk_secret_key',
      { expiresIn: '30d' }
    );
    
    res.status(201).json({
      message: 'Chauffeur créé avec succès',
      token,
      driver: {
        id: driver._id,
        nom: driver.nom,
        prenom: driver.prenom,
        email: driver.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Connexion d'un chauffeur
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Trouver le chauffeur
    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await driver.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Générer un token JWT
    const token = jwt.sign(
      { driverId: driver._id },
      process.env.JWT_SECRET || 'mslk_secret_key',
      { expiresIn: '30d' }
    );
    
    res.json({
      message: 'Connexion réussie',
      token,
      driver: {
        id: driver._id,
        nom: driver.nom,
        prenom: driver.prenom,
        email: driver.email,
        statut: driver.statut
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Middleware pour vérifier le token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token manquant' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mslk_secret_key');
    req.driverId = decoded.driverId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Obtenir le profil du chauffeur
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const driver = await Driver.findById(req.driverId).select('-password');
    if (!driver) {
      return res.status(404).json({ message: 'Chauffeur non trouvé' });
    }
    res.json(driver);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Mettre à jour le statut du chauffeur
router.put('/status', authMiddleware, async (req, res) => {
  try {
    const { statut } = req.body;
    const driver = await Driver.findByIdAndUpdate(
      req.driverId,
      { statut },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'Statut mis à jour',
      driver
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

module.exports = router;
module.exports.authMiddleware = authMiddleware;
