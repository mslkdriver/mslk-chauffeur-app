const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const driverSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  telephone: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  numeroPermis: {
    type: String,
    required: true
  },
  vehicule: {
    marque: String,
    modele: String,
    immatriculation: String,
    couleur: String
  },
  statut: {
    type: String,
    enum: ['disponible', 'en_course', 'hors_ligne'],
    default: 'hors_ligne'
  },
  position: {
    latitude: Number,
    longitude: Number,
    lastUpdate: Date
  },
  noteMoyenne: {
    type: Number,
    default: 0
  },
  nombreCourses: {
    type: Number,
    default: 0
  },
  dateInscription: {
    type: Date,
    default: Date.now
  }
});

// Hash password avant sauvegarde
driverSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Méthode pour comparer les mots de passe
driverSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Driver', driverSchema);
