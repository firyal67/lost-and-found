# Architecture technique

## Vue d'ensemble

```
┌──────────────────┐         HTTPS         ┌──────────────────┐
│   Navigateur     │ ──────────────────────▶│  Vercel (Next.js)│
│                  │ ◀────────────────────── │  (Frontend)      │
└──────────────────┘                        └────────┬─────────┘
                                                     │ HTTPS + WebSocket
                                                     ▼
                                            ┌──────────────────┐
                                            │ Railway (Express) │
                                            │ + Socket.IO       │
                                            │ (Backend API)     │
                                            └────────┬─────────┘
                                                     │
                                                     ▼
                                            ┌──────────────────┐
                                            │  MongoDB Atlas    │
                                            └──────────────────┘
```

---

## Backend

### Structure des modules

```
src/
├── server.js          # Point d'entrée : HTTP + Socket.IO
├── app.js             # Express app : middlewares + routes
│
├── config/
│   ├── db.js          # Connexion Mongoose
│   ├── logger.js      # Pino (JSON en prod, pretty en dev)
│   ├── rate-limiter.js# Limiteurs par route
│   └── upload.js      # Multer (JPEG/PNG/WebP/GIF, 5 Mo max)
│
├── models/
│   ├── User.model.js
│   ├── Post.model.js
│   ├── Contact.model.js
│   ├── Message.model.js
│   ├── Report.model.js
│   └── AuditLog.model.js
│
├── controllers/       # Logique métier
├── routes/            # Définition des endpoints
├── middleware/
│   ├── auth.middleware.js      # authenticateJWT, authorizeRole
│   ├── ownership.middleware.js # checkPostOwner, checkContactOwner
│   └── validate.middleware.js  # express-validator + sanitize-html
│
├── validators/        # Règles de validation par domaine
├── services/
│   ├── email.service.js   # Nodemailer (Ethereal en dev, SMTP en prod)
│   └── audit.service.js   # writeAuditLog (non-bloquant)
└── utils/
    ├── jwt.utils.js    # generateAccessToken, generateRefreshToken
    └── matchScore.js   # Algorithme de scoring de correspondance
```

### Authentification

```
POST /auth/login
  → génère accessToken (JWT, 15 min) + refreshToken (JWT, 7 j)
  → refreshToken stocké dans user.refreshTokens[] (révocation individuelle)
  → refreshToken posé en cookie httpOnly

GET /api/* (protected)
  Authorization: Bearer <accessToken>
  → authenticateJWT vérifie le JWT et charge req.user depuis la DB

POST /auth/refresh
  → cookie refreshToken → nouveau accessToken + rotation du refreshToken
  → détection de réutilisation : si token pas le dernier → révocation totale
```

### RBAC (contrôle d'accès basé sur les rôles)

Trois niveaux de protection empilables :

1. **`authenticateJWT`** — vérifie le JWT, rejette les comptes bannis
2. **`authorizeRole('admin')`** — vérifie le rôle
3. **`checkPostOwner()` / `checkContactOwner()`** — vérifie la propriété de la ressource

Les admins passent automatiquement les vérifications de propriété.

### Algorithme de correspondance (matchScore)

Score 0–100 calculé pour chaque annonce candidate :

| Critère | Points |
|---|---|
| `objectType` identique | 40 |
| `city` identique | 25 |
| `delegation` identique | 10 |
| Proximité temporelle (0–15 j) | 15 |
| Similarité mots-clés (Jaccard) | 10 |

Seuil minimum : **15 points**. Maximum retourné : **5 suggestions**.

---

## Frontend

### Structure des modules

```
src/
├── app/                    # App Router Next.js
│   ├── page.jsx            # Accueil
│   ├── posts/              # Liste + détail + création
│   ├── dashboard/          # Espace utilisateur + admin
│   └── auth/               # Login, register, forgot/reset password
│
├── components/
│   ├── auth/               # AdminGuard, UserGuard, RoleGuard, Show
│   ├── layout/             # Header, PageContainer, LayoutShell
│   └── ui/                 # Composants Radix UI + Pagination
│
├── lib/
│   ├── api-client.js       # fetch wrapper avec refresh automatique
│   └── api/                # Clients par domaine (auth, posts, contacts…)
│
├── store/
│   ├── index.js            # Redux store
│   ├── slices/authSlice.js # État d'authentification
│   └── rbac.js             # Hooks : useIsAdmin, useIsOwner, useCanAccess
│
├── middleware.js           # Protection des routes (Next.js Edge)
│
└── app/api/[...path]/      # Proxy vers Express (relaie Set-Cookie)
    └── route.js
```

### Gestion de la session

```
App mount
  → hydrateAuth dispatch
  → POST /auth/refresh (cookie) → accessToken frais
  → GET /auth/me → user object
  → Redux store : { user, accessToken, isHydrating: false }

Requête API protégée
  → api-client.js envoie Authorization: Bearer <accessToken>
  → Si 401 + code TOKEN_EXPIRED → refresh silencieux → retry
  → Si refresh échoue → événement "auth:logout" → forceLogout
```

### Protection des routes

**Edge (Next.js middleware) :**
- Routes protégées : `/dashboard`, `/posts/new` → redirect `/auth/login` si pas de cookie
- Routes admin : `/dashboard/admin/*`, `/dashboard/reports` → même vérification

**Client (Guards) :**
- `AdminGuard` — bloque les non-admins avec écran 403
- `UserGuard` — bloque les non-authentifiés
- `RoleGuard` — guard flexible (prédicat, rôle, ou "auth")

### Proxy API

En développement et production, le frontend inclut une route API catch-all (`/api/[...path]`) qui :
1. Relaie la requête vers le backend Express
2. Copie **tous** les headers de réponse, y compris `Set-Cookie`
3. Permet aux cookies httpOnly de fonctionner entre domaines différents (Vercel ↔ Railway)

---

## Modèles de données

### User
```
_id, name, email (unique), password (hash bcrypt), role (user|admin),
isActive, isEmailVerified, emailVerificationToken, emailVerificationExpires,
refreshTokens[], passwordResetToken, passwordResetExpires, phone, timestamps
```

### Post
```
_id, type (lost|found), objectType, title, description, city, delegation,
date, maskedDocNumber, photo (URL), reward, author (ref User),
status (active|resolved|matched|archived), matchedWith (ref Post),
contactPreferences {phone, email, platform}, contactEmail, contactPhone,
resolvedAt, matchedAt, archivedAt, timestamps
```

### Contact
```
_id, post (ref Post), requester (ref User), owner (ref User),
message, status (pending|approved|rejected),
revealedEmail, revealedPhone, timestamps
```

### Message
```
_id, contact (ref Contact), sender (ref User), content, read, timestamps
```

### Report
```
_id, post (ref Post), reporter (ref User), reason, comment,
status (pending|reviewed|actioned|dismissed),
adminNote, reviewedBy (ref User), reviewedAt, timestamps
```

### AuditLog (immuable)
```
_id, action (enum), performedBy (ref User),
targetUser?, targetPost?, targetReport?,
details (Mixed), ip, userAgent, timestamps
```

---

## Sécurité

| Mesure | Implémentation |
|---|---|
| XSS | `sanitize-html` sur tous les champs texte stockés en DB |
| Injection NoSQL | Mongoose + validation express-validator |
| CSRF | Cookies `httpOnly` + `SameSite` (lax dev, none+secure prod) |
| Brute force | Rate limiting par route, détection de réutilisation de refresh token |
| Headers HTTP | `helmet` (CSP, HSTS, X-Frame-Options…) |
| CORS | Liste blanche d'origines via `ALLOWED_ORIGINS` |
| Données sensibles | Documents partiellement masqués (format `****1234`) |
| Comptes bannis | Vérification à chaque requête REST et connexion Socket.IO |
