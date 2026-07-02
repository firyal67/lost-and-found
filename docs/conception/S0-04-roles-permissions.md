# S0-04 — Rôles et Permissions (RBAC)

## Rôles

| Rôle | Description |
|---|---|
| `guest` | Visiteur non connecté |
| `user` | Utilisateur inscrit et connecté |
| `admin` | Modérateur / administrateur |

## Matrice des permissions

### Posts

| Action | guest | user | admin |
|---|---|---|---|
| Lire | ✓ | ✓ | ✓ |
| Créer | — | ✓ | ✓ |
| Modifier (own) | — | ✓ | ✓ |
| Modifier (any) | — | — | ✓ |
| Supprimer (own) | — | ✓ | ✓ |
| Supprimer (any) | — | — | ✓ |

### Contacts

| Action | guest | user | admin |
|---|---|---|---|
| Envoyer | — | ✓ | ✓ |
| Approuver/refuser | — | ✓ (own) | ✓ |
| Voir tout | — | — | ✓ |

### Signalements

| Action | guest | user | admin |
|---|---|---|---|
| Signaler | — | ✓ | ✓ |
| Traiter | — | — | ✓ |

### Admin

| Action | guest | user | admin |
|---|---|---|---|
| Dashboard admin | — | — | ✓ |
| Bannir/débannir | — | — | ✓ |
| Métriques | — | — | ✓ |

## Middlewares backend

```js
authenticateJWT   // vérifie le token Bearer
authorizeRole()   // vérifie le rôle
checkOwner()      // vérifie que l'user est l'auteur
```

## Protection routes Next.js

```ts
// middleware.ts
if (pathname.startsWith('/dashboard')) → redirect /auth/login si non connecté
if (pathname.startsWith('/admin'))     → redirect / si role !== 'admin'
```

## Bannissement

`isActive: false` → middleware retourne 401 "Compte suspendu" à chaque requête
