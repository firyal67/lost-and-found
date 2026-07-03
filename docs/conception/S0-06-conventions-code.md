# S0-06 — Structure des Dossiers et Conventions de Code

## Structure complète du projet

```
lost-found-tunisia/
├── backend/
│   ├── src/
│   │   ├── config/         db.js
│   │   ├── controllers/    auth · post · contact · report · admin
│   │   ├── middleware/     auth · rbac · checkOwner · validate · rateLimit
│   │   ├── models/         User · Post · Contact · Report
│   │   ├── routes/         auth · post · contact · report · admin
│   │   ├── services/       matching.service.js
│   │   ├── utils/          jwt.utils.js · privacy.utils.js
│   │   ├── validators/     auth · post
│   │   ├── app.js
│   │   └── server.js
│   └── package.json
│
└── frontend/
    └── src/
        ├── app/
        │   ├── (public)/   page.tsx · posts/page.tsx · posts/[id]/page.tsx
        │   ├── auth/       login · register · forgot-password
        │   ├── dashboard/  layout · page · posts · contacts
        │   └── admin/      layout · page · reports · users · stats
        ├── components/
        │   ├── ui/         Shadcn (Button, Input, Card…)
        │   ├── layout/     Header · Sidebar · DashboardLayout
        │   └── features/   posts · auth · contacts · admin
        ├── store/          index · hooks · slices/
        ├── lib/            api-client.ts · utils · api/
        ├── hooks/          useAuth · usePosts
        └── middleware.ts   protections de routes
```

## Conventions de nommage

| Élément | Convention | Exemple |
|---|---|---|
| Composants React | PascalCase | `PostCard.tsx` |
| Utilitaires | camelCase | `jwt.utils.js` |
| Modèles Mongoose | PascalCase + `.model.js` | `User.model.js` |
| Routes/Controllers | camelCase + suffix | `auth.routes.js` |
| Variables | camelCase | `accessToken` |
| Constantes | UPPER_SNAKE | `JWT_EXPIRES_IN` |
| Types TS | PascalCase | `RegisterPayload` |
| Endpoints API | kebab-case | `/api/auth/reset-password` |

## Règles de code

**Backend**
- `async/await` partout, `try/catch` + `next(error)` dans tous les controllers
- Validation avant le controller, jamais de logique dans les routes

**Frontend**
- `"use client"` uniquement si nécessaire
- Pas de `any` TypeScript
- Appels API via `apiFetch` (wrapper Fetch natif), jamais directement dans les composants

## Git

```
Branches : feature/us-XX-description
Commits  : feat(auth): add register endpoint (US-01)
Types    : feat · fix · refactor · test · docs · chore
```
