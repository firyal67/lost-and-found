# Lost & Found Tunisia

Plateforme web de déclaration et recherche d'objets perdus et trouvés en Tunisie.

## Stack technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, Redux Toolkit, Tailwind CSS |
| Backend | Node.js, Express.js, Socket.IO |
| Base de données | MongoDB avec Mongoose |
| Authentification | JWT (access token 15 min + refresh token 7 j, cookie httpOnly) |
| Déploiement | Vercel (frontend) + Railway (backend) |

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | `feryelguehis86@gmail.com` | `Admin123!!` |
| Utilisateur | `feryel@gmail.com` | `User123!!` |

Les autres utilisateurs seedés : `sarra@example.com`, `mohamed@example.com` (mdp : `User1234!`).

---

## Structure du projet

```
projet/
├── frontend/          # Application Next.js
│   ├── src/
│   │   ├── app/       # Pages (App Router)
│   │   ├── components/
│   │   ├── lib/api/   # Clients API par domaine
│   │   ├── store/     # Redux slices
│   │   └── middleware.js  # Protection des routes (Edge)
│   ├── vercel.json
│   └── next.config.mjs
│
├── backend/           # API Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── validators/
│   │   ├── services/
│   │   ├── config/
│   │   └── utils/
│   ├── railway.toml
│   └── .env.example
│
└── docs/
    └── conception/    # Documents d'architecture
```

---

## Démarrage local

### Prérequis

- Node.js ≥ 18
- MongoDB local (ou Atlas)

### Backend

```bash
cd backend
cp .env.example .env          # Remplir les variables
npm install
npm run dev                   # Port 5000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local   # ou créer manuellement
npm install
npm run dev                        # Port 3000
```

Variables d'environnement frontend minimales :

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Déploiement production

Voir [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) pour le guide complet Railway + Vercel.

---

## Documentation API

Voir [`docs/API.md`](docs/API.md) pour la référence complète de tous les endpoints.

---

## Architecture

Voir [`docs/conception/`](docs/conception/) pour les diagrammes et décisions d'architecture.
