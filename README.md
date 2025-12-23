# Application Chauffeur MSLK

Application backend pour les chauffeurs MSLK permettant la connexion, la réception et la gestion des courses en temps réel.

## Fonctionnalités

- **Authentification sécurisée** : Inscription et connexion avec JWT
- **Gestion du profil** : Informations chauffeur et véhicule
- **Réception de courses** : Notifications en temps réel via Socket.IO
- **Gestion des courses** : Accepter, démarrer, terminer ou annuler une course
- **Statut en ligne** : Mise à jour du statut (disponible, en course, hors ligne)
- **Historique** : Suivi des courses complétées

## Technologies utilisées

- **Node.js** + **Express** : Serveur backend
- **MongoDB** + **Mongoose** : Base de données
- **Socket.IO** : Communication en temps réel
- **JWT** : Authentification
- **bcryptjs** : Sécurisation des mots de passe

## Installation

### Prérequis

- Node.js (version 18 ou supérieure)
- MongoDB

### Étapes

1. Cloner le dépôt :
```bash
git clone https://github.com/mslkdriver/mslk-chauffeur-app.git
cd mslk-chauffeur-app
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.example .env
```
Modifier le fichier `.env` avec vos paramètres.

4. Démarrer le serveur :
```bash
# Mode production
npm start

# Mode développement
npm run dev
```

Le serveur sera accessible sur `http://localhost:3000`

## API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription d'un nouveau chauffeur
- `POST /api/auth/login` - Connexion
- `GET /api/auth/profile` - Obtenir le profil (nécessite authentification)
- `PUT /api/auth/status` - Mettre à jour le statut

### Courses

- `GET /api/rides/available` - Obtenir les courses disponibles
- `GET /api/rides/my-rides` - Obtenir les courses du chauffeur
- `GET /api/rides/:rideId` - Obtenir une course spécifique
- `POST /api/rides/:rideId/accept` - Accepter une course
- `POST /api/rides/:rideId/start` - Démarrer une course
- `POST /api/rides/:rideId/complete` - Terminer une course
- `POST /api/rides/:rideId/cancel` - Annuler une course

## Structure du projet

```
mslk-chauffeur-app/
├── models/          # Modèles MongoDB
│   ├── Driver.js
│   └── Ride.js
├── routes/          # Routes API
│   ├── auth.js
│   └── rides.js
├── server.js        # Point d'entrée
├── package.json
├── .env.example
└── .gitignore
```

## Socket.IO Events

- `driver_online` - Chauffeur se connecte
- `ride_accepted` - Course acceptée
- `ride_started` - Course démarrée
- `ride_completed` - Course terminée
- `ride_cancelled` - Course annulée

## Application Mobile

Cette API est conçue pour être utilisée avec une application mobile React Native ou Flutter pour les chauffeurs.

## Déploiement

L'application peut être déployée sur :
- Hostinger
- Heroku
- DigitalOcean
- AWS

## Licence

MIT
