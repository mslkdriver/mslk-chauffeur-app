# Guide de Déploiement - MSLK Chauffeur App

## État du Projet

✅ **Backend API Complété** - L'API backend est prête pour le déploiement
✅ **Documentation Mobile** - Fichier PROMPT_APP_MOBILE.md contient toutes les spécifications
⏳ **Déploiement Hostinger** - En cours de configuration

---

## Option 1: Déploiement sur Hostinger

### Problème Actuel
Hostinger ne détecte pas automatiquement la structure du projet Express.

### Solutions

1. **Utiliser le déploiement manuel via SSH**
   - Connectez-vous en SSH à votre serveur Hostinger
   - Clonez le repository: `git clone https://github.com/mslkdriver/mslk-chauffeur-app.git`
   - Installez les dépendances: `npm install`
   - Configurez les variables d'environnement (voir .env.example)
   - Démarrez l'application: `npm start`

2. **Créer un fichier Dockerfile**
   - Hostinger supporte les déploiements Docker
   - Créez un Dockerfile pour conteneuriser l'application

---

## Option 2: Déploiement sur Heroku

```bash
# Installer Heroku CLI
heroku login
heroku create mslk-chauffeur-app
git push heroku main
heroku config:set MONGODB_URI=votre_uri_mongodb
heroku config:set JWT_SECRET=votre_secret
```

---

## Option 3: Déploiement sur Railway

1. Connectez-vous sur railway.app
2. Créez un nouveau projet depuis GitHub
3. Sélectionnez le repository mslk-chauffeur-app
4. Railway détectera automatiquement Node.js
5. Ajoutez les variables d'environnement
6. Déployez!

---

## Option 4: Déploiement sur Render

1. Connectez-vous sur render.com
2. New > Web Service
3. Connectez votre repository GitHub
4. Configuration:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Ajoutez les variables d'environnement

---

## Variables d'Environnement Requises

```
PORT=3000
MONGODB_URI=mongodb+srv://votre_uri
JWT_SECRET=votre_secret_jwt_securise
NODE_ENV=production
```

---

## Prochaines Étapes

1. ✅ Backend API créé et prêt
2. ✅ Documentation mobile complète (PROMPT_APP_MOBILE.md)
3. ⏳ Déployer le backend (choisir une option ci-dessus)
4. 📱 Développer l'application mobile React Native/Flutter
   - Utiliser les spécifications dans PROMPT_APP_MOBILE.md
   - Interface chauffeur avec boutons inscription/connexion
   - Toggle vert/rouge disponible/non disponible
   - Accepter/refuser courses
   - Sonnerie Uber-style pour nouvelles courses
   - Interface admin (mslkdriver@gmail.com / SAMIR1663)
   - Commission 15% affichée
   - Support +33780996363

---

## Support

Pour toute question sur le déploiement, consultez:
- README.md pour les fonctionnalités
- PROMPT_APP_MOBILE.md pour les spécifications mobile
- .env.example pour la configuration
