# Guide de déploiement

## Vue d'ensemble

| Service | Plateforme | URL |
|---|---|---|
| Backend (API) | Railway | `https://<app>.railway.app` |
| Frontend | Vercel | `https://<app>.vercel.app` |
| Base de données | MongoDB Atlas | connexion via MONGODB_URI |

---

## 1. Base de données — MongoDB Atlas

1. Créer un cluster sur [cloud.mongodb.com](https://cloud.mongodb.com)
2. Créer un utilisateur DB avec mot de passe fort
3. Autoriser l'IP `0.0.0.0/0` (ou les IPs Railway spécifiques)
4. Copier la connection string :
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lostandfound?retryWrites=true&w=majority
   ```

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
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<64 caractères aléatoires>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<64 caractères aléatoires différents>
JWT_REFRESH_EXPIRES_IN=7d
ALLOWED_ORIGINS=https://<votre-app>.vercel.app
CLIENT_URL=https://<votre-app>.vercel.app
LOG_LEVEL=warn

# Email (optionnel — Ethereal utilisé en l'absence de SMTP_HOST)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre@gmail.com
SMTP_PASS=votre_app_password
```

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
NEXT_PUBLIC_API_URL=https://<votre-backend>.railway.app/api
NEXT_PUBLIC_SOCKET_URL=https://<votre-backend>.railway.app
```

### Note sur les cookies cross-domain

En production, le backend pose le cookie `refreshToken` avec `sameSite=none; Secure`.  
Cela est nécessaire car Vercel et Railway sont sur des domaines différents.  
Le proxy Next.js (`/api/[...path]/route.js`) relaie les headers `Set-Cookie` au navigateur.

---

## 4. Ordre de déploiement recommandé

1. Déployer MongoDB Atlas → copier l'URI
2. Déployer le backend Railway → récupérer l'URL publique
3. Déployer le frontend Vercel → configurer `NEXT_PUBLIC_API_URL` avec l'URL Railway
4. Retourner sur Railway → mettre à jour `ALLOWED_ORIGINS` avec l'URL Vercel
5. Redéployer le backend

---

## 5. Vérification post-déploiement

```bash
# Healthcheck backend
curl https://<app>.railway.app/api/health
# Réponse attendue : {"status":"ok"}

# Test login
curl -X POST https://<app>.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}'
```
