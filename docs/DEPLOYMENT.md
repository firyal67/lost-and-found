# Guide de déploiement

## Vue d'ensemble

| Service | Plateforme | URL |
|---|---|---|---|
| Backend (API) | Railway | `https://backend-service-production-ac47.up.railway.app` |
| Frontend | Vercel | `https://frontend-woad-nine-29.vercel.app` |
| Base de données | Railway MongoDB (plugin interne) | `mongodb://mongodb.railway.internal:27017/lostandfound` |

---

## 1. Base de données — Railway MongoDB (plugin interne)

1. Dans le projet Railway, cliquer sur **"Create Plugin"** → **Database** → **MongoDB**
2. Railway injecte automatiquement la variable `MONGO_URL` (ou `MONGODB_URI`) dans le backend via une variable liée
3. Aucune configuration manuelle d'IP ou d'utilisateur n'est nécessaire
4. L'URI interne sera de la forme :
   ```
   mongodb://mongodb.railway.internal:27017/lostandfound
   ```
   **Note** : Le backend utilise cette variable automatiquement via `process.env.MONGO_URL` dans `config/db.js`.

---

## 2. Backend — Railway

### Déploiement initial

1. Créer un nouveau projet sur [railway.app](https://railway.app)
2. "Deploy from GitHub repo" → sélectionner ce repo
3. Définir le **Root Directory** : `backend`
4. Railway détecte `railway.toml` automatiquement

### Variables d'environnement requises

```env
NODE_ENV=production
PORT=5000
MONGO_URL=<injecté automatiquement par Railway MongoDB plugin>
JWT_SECRET=<64 caractères aléatoires>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<64 caractères aléatoires différents>
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://frontend-woad-nine-29.vercel.app
CLIENT_URL=https://frontend-woad-nine-29.vercel.app
LOG_LEVEL=warn

# Email (optionnel — Ethereal utilisé en l'absence de SMTP_HOST)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@gmail.com
SMTP_PASS=votre_app_password
```

> **MONGO_URL** est automatiquement injectée par Railway lors de l'ajout du plugin MongoDB.  
> Ne pas la définir manuellement.

Générer des secrets JWT sécurisés :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Healthcheck

Railway vérifie automatiquement `GET /api/health` (configuré dans `railway.toml`).

---

## 3. Frontend — Vercel

### Déploiement initial

1. Importer le repo sur [vercel.com](https://vercel.com)
2. Définir le **Root Directory** : `frontend`
3. Framework : Next.js (détecté automatiquement)

### Variables d'environnement requises

```env
NEXT_PUBLIC_API_URL=https://backend-service-production-ac47.up.railway.app/api
```

### Note sur les cookies cross-domain

En production, le backend pose le cookie `refreshToken` avec `sameSite=none; Secure`.  
Cela est nécessaire car Vercel et Railway sont sur des domaines différents.  
Le proxy Next.js (`/api/[...path]/route.js`) relaie les headers `Set-Cookie` au navigateur.

---

## 4. Ordre de déploiement recommandé

1. Ajouter le plugin **MongoDB** au projet Railway (injecte `MONGO_URL`)
2. Déployer le backend Railway → récupérer l'URL publique
3. Définir les variables d'environnement du backend (JWT secrets, ALLOWED_ORIGINS, etc.)
4. Déployer le frontend Vercel → configurer `NEXT_PUBLIC_API_URL` avec l'URL Railway
5. Retourner sur Railway → mettre à jour `ALLOWED_ORIGINS` avec l'URL Vercel
6. Redéployer le backend

---

## 5. Vérification post-déploiement

```bash
# Healthcheck backend
curl https://backend-service-production-ac47.up.railway.app/api/health
# Réponse attendue : {"status":"ok"}

# Healthcheck via le proxy frontend
curl https://frontend-woad-nine-29.vercel.app/api/health

# Test login
curl -X POST https://backend-service-production-ac47.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```
