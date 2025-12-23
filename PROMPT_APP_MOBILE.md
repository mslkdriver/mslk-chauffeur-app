# PROMPT DÉVELOPPEMENT APPLICATION MOBILE MSLK CHAUFFEUR

## 📱 INTERFACE D'ACCUEIL

### Écran Principal
- **Bouton "Inscription Chauffeur"** : Permet aux nouveaux chauffeurs de créer un compte
- **Bouton "Se Connecter"** : Connexion pour les chauffeurs existants
- **Bouton Admin** (en haut à droite) : Accès administrateur discret
- **Service d'assistance** (en bas) : +33780996363

---

## 👤 ESPACE CHAUFFEUR

### 1. Tableau de Bord Principal

#### Statut de Disponibilité
- **Toggle Switch** avec 2 états :
  - 🟢 **DISPONIBLE** (vert) : Chauffeur prêt à recevoir des courses
  - 🔴 **NON DISPONIBLE** (rouge) : Chauffeur hors ligne

#### Section Chiffre d'Affaires
```
┌─────────────────────────────────────┐
│  💰 Chiffre d'Affaires              │
│                                     │
│  Total Brut : [XXX €]               │
│  Commission (15%) : [XX €]          │
│  ───────────────────────────         │
│  Net à recevoir : [XXX €]           │
└─────────────────────────────────────┘
```

#### Historique des Courses
- Liste des courses **acceptées et effectuées**
- Chaque course affiche :
  - Date et heure
  - Client
  - Trajet (départ → arrivée)
  - Prix
  - Statut

### 2. Réception de Nouvelles Courses

#### Notification Sonore
- 🔔 **Sonnerie type Uber** quand une nouvelle course arrive
- Notification push avec vibration

#### Carte de Course
```
┌─────────────────────────────────────┐
│  🚗 NOUVELLE COURSE                 │
│                                     │
│  👤 Client : [Nom]                  │
│  📞 Tél : [Numéro]                  │
│  🕐 Heure : [HH:MM]                 │
│  📍 Prise en charge : [Adresse]     │
│  📍 Destination : [Adresse]         │
│  💶 Prix : [XX €]                   │
│  📝 Message : [Note...]             │
│                                     │
│  [✅ ACCEPTER]    [❌ REFUSER]      │
└─────────────────────────────────────┘
```

### 3. Gestion de Course Active

Après acceptation :
```
┌─────────────────────────────────────┐
│  🚗 COURSE EN COURS                 │
│                                     │
│  [Détails de la course]             │
│                                     │
│  [📱 VOIR LA COURSE]                │
│  [✔️ TERMINER LA COURSE]            │
└─────────────────────────────────────┘
```

---

## 👨‍💼 ESPACE ADMINISTRATEUR

### Connexion Admin
- **Email** : mslkdriver@gmail.com
- **Mot de passe** : SAMIR1663

### 1. Créer une Nouvelle Course

Formulaire complet :
```
┌─────────────────────────────────────┐
│  ➕ CRÉER UNE COURSE                │
│                                     │
│  👤 Nom du client :                 │
│  [_________________________]        │
│                                     │
│  📞 Numéro de téléphone :           │
│  [_________________________]        │
│                                     │
│  🕐 Date et heure :                 │
│  [📅 JJ/MM/AAAA] [🕐 HH:MM]        │
│                                     │
│  📍 Lieu de prise en charge :       │
│  [_________________________]        │
│                                     │
│  📍 Lieu de dépôt :                 │
│  [_________________________]        │
│                                     │
│  💶 Prix :                          │
│  [_____________] €                  │
│                                     │
│  📝 Message (optionnel) :           │
│  [_________________________]        │
│  [_________________________]        │
│                                     │
│  [📤 ENVOYER AUX CHAUFFEURS]        │
└─────────────────────────────────────┘
```

### 2. Dashboard Chauffeurs

Tableau récapitulatif :
```
┌──────────────────────────────────────────────────────────┐
│  CHAUFFEUR       │ STATUT │ COURSES │ CA BRUT │ ACTIONS  │
├──────────────────┼────────┼─────────┼─────────┼──────────┤
│  Jean Dupont     │  🟢    │   15    │ 450€    │ [📝][🗑️] │
│  Marie Martin    │  🔴    │   23    │ 720€    │ [📝][🗑️] │
│  Ahmed Ben       │  🟢    │   8     │ 240€    │ [📝][🗑️] │
└──────────────────────────────────────────────────────────┘
```

Actions disponibles :
- ✏️ **Modifier** les informations chauffeur
- 🗑️ **Radier** un chauffeur
- ⚠️ **Envoyer un avertissement**

### 3. Gestion des Courses

Liste de toutes les courses :
```
┌──────────────────────────────────────────────────────────┐
│  DATE    │ CLIENT │ TRAJET      │ PRIX │ CHAUFFEUR  │ ⚙️ │
├──────────┼────────┼─────────────┼──────┼────────────┼────┤
│ 24/12 14h│ Dupont │ Paris→Orly  │ 45€  │ Jean D.    │[✏️][🗑️]│
│ 24/12 15h│ Martin │ CDG→Paris   │ 60€  │ Marie M.   │[✏️][🗑️]│
└──────────────────────────────────────────────────────────┘
```

Actions :
- ✏️ **Modifier** : Prix, horaire, détails
- 🗑️ **Supprimer** une course

---

## 🎨 DESIGN & EXPÉRIENCE UTILISATEUR

### Couleurs Principales
- **Vert** (#00C853) : Disponible, Accepter, Succès
- **Rouge** (#FF1744) : Non disponible, Refuser, Alerte
- **Bleu** (#2196F3) : Actions principales
- **Gris** (#757575) : Éléments secondaires

### Typographie
- **Titres** : Bold, 18-24px
- **Contenu** : Regular, 14-16px
- **Prix** : Bold, 20px, couleur accentuée

### Animations
- Transition fluide du toggle disponibilité
- Animation d'arrivée des nouvelles courses
- Feedback visuel sur les boutons

---

## 🔔 NOTIFICATIONS

### Sonnerie Nouvelle Course
- **Type** : Sonnerie inspirée d'Uber
- **Durée** : 5-10 secondes en boucle jusqu'à action
- **Vibration** : Pattern court répété
- **Notification** : Alerte visuelle + sonore

---

## 📊 CALCULS AUTOMATIQUES

### Commission
- **Taux** : 15% sur chaque course
- **Affichage** :
  - Prix brut
  - Commission (15%)
  - Net chauffeur (85%)

### Exemple
```
Course : 50€
Commission (15%) : 7,50€
Net chauffeur : 42,50€
```

---

## 🔐 SÉCURITÉ

- Authentification sécurisée JWT
- Mots de passe hashés avec bcrypt
- Sessions séparées Admin/Chauffeur
- Protection CORS

---

## 📱 FOOTER PERMANENT

```
┌─────────────────────────────────────┐
│         SERVICE D'ASSISTANCE        │
│      📞 +33 7 80 99 63 63          │
└─────────────────────────────────────┘
```

---

## 🛠️ STACK TECHNIQUE RECOMMANDÉE

### Frontend Mobile
- **React Native** ou **Flutter**
- Navigation : React Navigation / Flutter Navigator
- State : Redux / Provider
- Notifications : Firebase Cloud Messaging
- Son : React Native Sound / Audioplayers

### Backend (déjà créé)
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO (notifications temps réel)
- JWT (authentification)

---

## 📋 FONCTIONNALITÉS DÉTAILLÉES

### Pour le Chauffeur
1. ✅ Inscription avec informations complètes
2. ✅ Connexion sécurisée
3. ✅ Toggle Disponible/Non disponible
4. ✅ Réception courses avec sonnerie
5. ✅ Accepter/Refuser courses
6. ✅ Voir détails course
7. ✅ Terminer course
8. ✅ Historique courses effectuées
9. ✅ Chiffre d'affaires avec commission
10. ✅ Support +33780996363

### Pour l'Administrateur
1. ✅ Connexion admin sécurisée
2. ✅ Créer courses (formulaire complet)
3. ✅ Envoyer courses aux chauffeurs
4. ✅ Voir liste chauffeurs disponibles
5. ✅ Voir statistiques (courses, CA)
6. ✅ Modifier courses existantes
7. ✅ Supprimer courses
8. ✅ Modifier prix
9. ✅ Radier chauffeurs
10. ✅ Envoyer avertissements

---

## 🚀 PROCHAINES ÉTAPES

1. Développer l'interface mobile (React Native/Flutter)
2. Intégrer avec le backend existant
3. Implémenter la sonnerie et notifications
4. Tester sur iOS et Android
5. Déployer en production

---

**API Backend déjà disponible à :**
- Repository : https://github.com/mslkdriver/mslk-chauffeur-app
- Documentation : README.md complet
- Endpoints : /api/auth et /api/rides
