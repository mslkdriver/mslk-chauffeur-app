const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
  numeroCommande: {
    type: String,
    required: true,
    unique: true
  },
  client: {
    nom: String,
    telephone: String
  },
  chauffeur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver'
  },
  depart: {
    adresse: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  arrivee: {
    adresse: {
      type: String,
      required: true
    },
    latitude: Number,
    longitude: Number
  },
  statut: {
    type: String,
    enum: ['en_attente', 'acceptee', 'en_cours', 'terminee', 'annulee'],
    default: 'en_attente'
  },
  distance: {
    type: Number
  },
  prix: {
    type: Number,
    required: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  dateAcceptation: Date,
  dateDebut: Date,
  dateFin: Date,
  note: {
    type: Number,
    min: 1,
    max: 5
  },
  commentaire: String
});

module.exports = mongoose.model('Ride', rideSchema);
