# S0-01 — Architecture Logicielle Globale

## Vue d'ensemble

Application web **Lost & Found Tunisia** — architecture 3-tiers découplée :

```
┌──────────────────────────────────────────────────────────────┐
│  CLIENT (Browser)                                            │
│  Next.js 14 (App Router) · TypeScript                        │
│  TailwindCSS · Shadcn UI · Redux Toolkit · Fetch API         │
└────────────────────┬─────────────────────────────────────────┘
                     │ HTTPS / REST JSON
                     │ Cookie httpOnly (refresh token)
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  API SERVER                                                  │
│  Node.js · Express · REST API                                │
│  Middlewares : CORS · JWT Auth · Validation · Rate Limit     │
│  Modules : Auth · Posts · Matching · Contact · Admin         │
└────────────────────┬─────────────────────────────────────────┘
                     │ Mongoose ODM
                     ▼
┌──────────────────────────────────────────────────────────────┐
│  BASE DE DONNÉES                                             │
│  MongoDB — Collections : users · posts · contacts · reports  │
└──────────────────────────────────────────────────────────────┘
```

## Couches détaillées

### Frontend — Next.js 14 (App Router)

```
src/
├── app/                    # Pages (file-system routing)
│   ├── (public)/           # Accueil, liste, détail
│   ├── auth/               # Login, Register
│   ├── dashboard/          # Espace utilisateur connecté
│   └── admin/              # Espace admin (RBAC)
├── components/
│   ├── ui/                 # Composants Shadcn (Button, Input…)
│   └── features/           # Composants métier (PostCard, MatchList…)
├── store/                  # Redux Toolkit (slices : auth, posts, contact)
├── lib/
│   ├── api-client.ts       # Fetch wrapper configuré
│   └── api/                # Fonctions d'appel API par domaine
└── hooks/                  # Custom hooks React
```

**Flux de données :**
`Page → dispatch(thunk) → axios → API → Redux state → UI re-render`

### Backend — Node.js / Express

```
src/
├── config/         # DB, env
├── models/         # Mongoose schemas
├── controllers/    # Logique métier par ressource
├── routes/         # Déclaration des endpoints
├── middleware/     # auth, validate, rateLimit, rbac
├── validators/     # express-validator rules
├── utils/          # jwt, helpers
└── services/       # Matching engine, notifications
```

**Pipeline d'une requête :**
```
Request → CORS → cookieParser → morgan
        → rateLimit → validate → authenticateJWT → authorizeRole
        → Controller → Model (Mongoose) → MongoDB
        → Response JSON
```

### Base de données — MongoDB

- 1 base : `lostandfound`
- Collections : `users`, `posts`, `contacts`, `reports`
- Index sur : `email` (unique), `posts.city`, `posts.objectType`, `posts.date`

## Patterns architecturaux

| Pattern | Application |
|---|---|
| RESTful API | Toutes les ressources backend |
| JWT Stateless + Refresh Token | Auth sans session serveur |
| RBAC | Rôles `user` / `admin` |
| Repository via Mongoose | Abstraction base de données |
| Slice Redux par domaine | État global frontend découplé |
| httpOnly Cookie | Sécurité refresh token |
| Fetch API natif | Requêtes HTTP sans dépendance externe |

## Communication inter-couches

| Sens | Protocole | Format |
|---|---|---|
| Frontend → Backend | HTTP/REST | JSON |
| Refresh token | Cookie httpOnly | — |
| Backend → MongoDB | Mongoose ODM | BSON |

## Environnements

| Env | Frontend | Backend | DB |
|---|---|---|---|
| Dev | `localhost:3000` | `localhost:5000` | MongoDB local |
| Prod | Vercel / Netlify | Railway / Render | MongoDB Atlas |
