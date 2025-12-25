# MSLK VTC - Application Web VTC Complete

## Problem Statement
Application VTC pour MSLK à Clermont-Ferrand, style TaxiProxi avec thème NOIR/OR exclusif.

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Geocoding**: OpenStreetMap Nominatim (gratuit)

## Features Implemented

### Client
- [x] Formulaire de réservation complet
- [x] Autocomplete adresses (OpenStreetMap)
- [x] Calcul prix en temps réel (2€/km + 5€)
- [x] Confirmation de réservation
- [x] Historique courses par email
- [x] Footer assistance (+33 7 80 99 63 63)

### Chauffeur
- [x] Inscription/Connexion
- [x] Dashboard courses disponibles
- [x] Accepter/Refuser courses
- [x] Statut (Disponible/Occupé/En route)
- [x] Navigation Waze/Google Maps
- [x] Stats CA journalier/hebdo/mensuel
- [x] Commission affichée

### Admin
- [x] Login sécurisé (admin@mslk-vtc.fr / Admin123!)
- [x] Dispatch manuel (assigner chauffeur)
- [x] Commission VARIABLE par course
- [x] Gestion chauffeurs (notes, activer/désactiver)
- [x] Stats globales (CA, commissions)
- [x] Export CSV

### Technique
- [x] PWA (manifest.json)
- [x] Theme NOIR #000000 / OR #D4AF37
- [x] Mobile-first responsive
- [x] JWT authentication
- [x] Notifications email (logs pour démo)

## API Endpoints

### Auth
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Trips
- POST /api/trips (créer réservation)
- GET /api/trips/calculate-price
- GET /api/trips/client/{email}

### Driver
- GET /api/driver/trips
- POST /api/driver/trips/{id}/accept
- POST /api/driver/trips/{id}/refuse
- POST /api/driver/trips/{id}/status
- PUT /api/driver/status
- GET /api/driver/stats

### Admin
- GET /api/admin/trips
- POST /api/admin/trips/{id}/assign
- PUT /api/admin/trips/{id}/commission
- DELETE /api/admin/trips/{id}
- GET /api/admin/drivers
- PUT /api/admin/drivers/{id}/commission
- PUT /api/admin/drivers/{id}/notes
- PUT /api/admin/drivers/{id}/toggle-active
- GET /api/admin/stats

### Geocoding
- GET /api/geocode/search?q={query}

## Next Tasks (Prochaine Phase)

1. **SMTP Configuration**: Configurer un vrai serveur SMTP pour les notifications email
2. **PWA Service Worker**: Ajouter sw.js pour fonctionnalité offline
3. **Notifications Push**: Intégrer Web Push pour alertes chauffeurs
4. **Export PDF**: Rapports PDF pour admin
5. **Stripe Integration**: Option paiement CB (si besoin)
6. **Authentification Google/Apple**: SSO pour clients

## Credentials de Test
- Admin: admin@mslk-vtc.fr / Admin123!
