# S0-04 — Rôles et Permissions (RBAC)

## Rôles

| Rôle    | Description                        |
|---------|------------------------------------|
| `guest` | Visiteur non connecté              |
| `user`  | Utilisateur inscrit et connecté    |
| `admin` | Modérateur / administrateur        |

Le rôle est stocké dans `User.role` (enum `['user', 'admin']`, défaut `'user'`).  
Le bannissement est géré séparément via `User.isActive: false`.

---

## Matrice des permissions

### Posts

| Action               | guest | user      | admin |
|----------------------|-------|-----------|-------|
| Lire                 | ✓     | ✓         | ✓     |
| Créer                | —     | ✓         | ✓     |
| Modifier (own)       | —     | ✓         | ✓     |
| Modifier (any)       | —     | —         | ✓     |
| Supprimer (own)      | —     | ✓         | ✓     |
| Supprimer (any)      | —     | —         | ✓     |
| Résoudre / Archiver  | —     | ✓ (own)   | ✓     |

### Contacts

| Action                  | guest | user      | admin |
|-------------------------|-------|-----------|-------|
| Envoyer une demande     | —     | ✓         | ✓     |
| Approuver / Rejeter     | —     | ✓ (own)   | ✓     |
| Voir ses propres        | —     | ✓         | ✓     |

### Chat / Messagerie

| Action                  | guest | user             | admin |
|-------------------------|-------|------------------|-------|
| Lire les messages       | —     | ✓ (participant)  | ✓     |
| Envoyer un message      | —     | ✓ (participant)  | ✓     |
| Connexion Socket.IO     | —     | ✓ (actif)        | ✓     |

### Signalements

| Action           | guest | user  | admin |
|------------------|-------|-------|-------|
| Signaler         | —     | ✓     | ✓     |
| Voir tous        | —     | —     | ✓     |
| Traiter / Clore  | —     | —     | ✓     |

### Administration

| Action              | guest | user | admin |
|---------------------|-------|------|-------|
| Dashboard admin     | —     | —    | ✓     |
| Liste utilisateurs  | —     | —    | ✓     |
| Bannir / Débannir   | —     | —    | ✓     |
| Métriques           | —     | —    | ✓     |

---

## Architecture backend

### Middlewares disponibles

```
backend/src/middleware/auth.middleware.js
backend/src/middleware/ownership.middleware.js
```

#### `authenticateJWT`

Vérifie le token Bearer, charge l'utilisateur depuis la DB, rejette les comptes bannis (`isActive: false`).
Attache `req.user`.

```js
const { authenticateJWT } = require('../middleware/auth.middleware');
router.use(authenticateJWT);
```

#### `authorizeRole(...roles)`

Vérifie que `req.user.role` est inclus dans la liste de rôles autorisés.
À utiliser après `authenticateJWT`.

```js
const { authorizeRole } = require('../middleware/auth.middleware');

// Admin seulement
router.use(authenticateJWT, authorizeRole('admin'));

// Plusieurs rôles
router.get('/resource', authenticateJWT, authorizeRole('admin', 'moderator'), handler);
```

#### `checkPostOwner([options])`

Charge le Post par `req.params.id`, vérifie que `req.user` en est l'auteur.
Les admins passent automatiquement (configurable via `allowAdmin`).
Attache `req.post` pour éviter un second appel DB dans le contrôleur.

```js
const { checkPostOwner } = require('../middleware/ownership.middleware');

router.delete('/:id', authenticateJWT, checkPostOwner(), deletePost);
router.patch('/:id',  authenticateJWT, checkPostOwner(), updatePost);

// Paramètre de route différent
router.delete('/:postId/photo', authenticateJWT, checkPostOwner({ paramName: 'postId' }), handler);

// Interdire même aux admins
router.patch('/:id/private', authenticateJWT, checkPostOwner({ allowAdmin: false }), handler);
```

#### `checkContactOwner([options])`

Charge le Contact par `req.params.id`, vérifie que `req.user` est le **owner** de l'annonce liée.
Les admins passent automatiquement.
Attache `req.contact`.

```js
const { checkContactOwner } = require('../middleware/ownership.middleware');

router.patch('/:id/approve', authenticateJWT, checkContactOwner(), approveContact);
router.patch('/:id/reject',  authenticateJWT, checkContactOwner(), rejectContact);
```

#### `checkOwnerOf(Model, ownerField, [options])`

Factory générique pour n'importe quel modèle Mongoose.

```js
const { checkOwnerOf } = require('../middleware/ownership.middleware');
const Comment = require('../models/Comment.model');

router.delete('/:id', authenticateJWT, checkOwnerOf(Comment, 'author'), deleteComment);
// req.comment est attaché automatiquement
```

#### `requireConversationAccess` (inline dans chat.routes.js)

Vérifie que le contact existe, que son statut est `approved`, et que `req.user` est l'un des deux participants.
Attache `req.contact`.

### Réutiliser `req.post` / `req.contact` dans les contrôleurs

Quand un middleware d'ownership est dans la chaîne, le document est déjà chargé et vérifié.
Les contrôleurs doivent utiliser le fallback `??` pour rester utilisables en dehors du middleware :

```js
const deletePost = async (req, res, next) => {
  const post = req.post ?? await Post.findById(req.params.id);
  // ...
};
```

### Schéma de composition type

```
router.verb('/path', authenticateJWT, [authorizeRole | checkOwner], handler)
```

| Niveau de protection         | Middlewares                                      |
|------------------------------|--------------------------------------------------|
| Authentifié uniquement       | `authenticateJWT`                                |
| Rôle fixe (ex: admin)        | `authenticateJWT, authorizeRole('admin')`        |
| Propriétaire ou admin        | `authenticateJWT, checkPostOwner()`              |
| Propriétaire strict          | `authenticateJWT, checkPostOwner({ allowAdmin: false })` |
| Admin strict (ex: bannir)    | `authenticateJWT, authorizeRole('admin')`        |

---

## Architecture frontend

### Guards de page

```
frontend/src/components/auth/
  AdminGuard.jsx   — admin seulement (role === 'admin')
  UserGuard.jsx    — tout utilisateur authentifié
  RoleGuard.jsx    — guard universel configurable
```

#### `AdminGuard`

Redirige vers `/auth/login` si non connecté.
Affiche un écran 403 si connecté mais pas admin.

```jsx
import AdminGuard from "@/components/auth/AdminGuard";

export default function AdminPage() {
  return (
    <AdminGuard>
      <PageContent />
    </AdminGuard>
  );
}
```

#### `UserGuard`

Redirige vers `/auth/login` si non connecté. Tout rôle autorisé.

```jsx
import UserGuard from "@/components/auth/UserGuard";

export default function ProtectedPage() {
  return (
    <UserGuard>
      <PageContent />
    </UserGuard>
  );
}
```

#### `RoleGuard`

Guard universel. Accepte une règle via la prop `require`.

| Valeur de `require`      | Comportement                               |
|--------------------------|--------------------------------------------|
| `"auth"` (défaut)        | Tout utilisateur connecté                  |
| `"admin"`                | `user.role === 'admin'`                    |
| Autre string             | `user.role === valeur`                     |
| `(user) => boolean`      | Prédicat personnalisé                      |

```jsx
import RoleGuard from "@/components/auth/RoleGuard";

// Tout utilisateur connecté
<RoleGuard><ProfilePage /></RoleGuard>

// Admin seulement
<RoleGuard require="admin"><MetricsPage /></RoleGuard>

// Prédicat personnalisé
<RoleGuard require={(u) => u.isEmailVerified}>
  <VerifiedOnlyFeature />
</RoleGuard>

// Redirection personnalisée + fallback
<RoleGuard require="admin" redirect="/unauthorized" fallback={<p>Accès refusé</p>}>
  <AdminDashboard />
</RoleGuard>
```

### Hooks RBAC

```
frontend/src/store/rbac.js
```

| Hook                        | Retourne                                              |
|-----------------------------|-------------------------------------------------------|
| `useAuthUser()`             | `user` ou `null`                                      |
| `useIsHydrating()`          | `boolean` — vrai pendant la rehydratation             |
| `useIsAuthenticated()`      | `boolean`                                             |
| `useIsAdmin()`              | `boolean` — `user.role === 'admin'`                   |
| `useHasRole(role)`          | `boolean` — correspondance exacte du rôle             |
| `useIsOwner(ownerId)`       | `boolean` — propriétaire ou admin (bypass configurable) |
| `useCanAccess(rule)`        | `boolean` — évalue la même règle que `RoleGuard`      |

```jsx
import { useIsAdmin, useIsOwner, useCanAccess } from "@/store/rbac";

function PostCard({ post }) {
  const isAdmin  = useIsAdmin();
  const isOwner  = useIsOwner(post.author._id);
  const canEdit  = isOwner || isAdmin;

  return (
    <div>
      <h2>{post.title}</h2>
      {canEdit && <EditButton />}
    </div>
  );
}
```

### Composant `<Show>`

```
frontend/src/components/auth/Show.jsx
```

Rendu conditionnel déclaratif basé sur les rôles — alternative propre aux blocs `{condition && <.../>}`.

| Prop       | Type                           | Description                              |
|------------|--------------------------------|------------------------------------------|
| `when`     | `"auth"│"admin"│string│fn`     | Règle d'accès (défaut: `"auth"`)         |
| `owner`    | `string`                       | Si fourni, passe aussi si owner ou admin |
| `fallback` | `ReactNode`                    | Rendu si accès refusé (défaut: `null`)   |

```jsx
import Show from "@/components/auth/Show";

// Bouton visible uniquement aux utilisateurs connectés
<Show when="auth">
  <ContactButton />
</Show>

// Boutons d'admin uniquement
<Show when="admin">
  <BanButton />
</Show>

// Visible au propriétaire ET aux admins
<Show owner={post.author._id}>
  <EditButton />
  <DeleteButton />
</Show>

// Avec fallback
<Show when="admin" fallback={<span>Vue publique</span>}>
  <span>Vue admin</span>
</Show>
```

### Middleware Next.js (edge)

```
frontend/src/middleware.js
```

Vérification légère à la bordure : redirige les utilisateurs non authentifiés (absence du cookie `refreshToken`) avant que la page ne se charge. Le décodage du rôle JWT est délégué aux guards client (`AdminGuard`, `RoleGuard`) car les primitives cryptographiques ne sont pas disponibles dans le runtime Edge.

| Route                    | Protection edge           | Protection client  |
|--------------------------|---------------------------|--------------------|
| `/dashboard`             | cookie présent            | `UserGuard`        |
| `/posts/new`             | cookie présent            | `UserGuard`        |
| `/dashboard/admin/*`     | cookie présent            | `AdminGuard`       |
| `/dashboard/reports`     | cookie présent            | `AdminGuard`       |

Pour ajouter une nouvelle route protégée :

```js
// middleware.js
const PROTECTED_ROUTES = ["/dashboard", "/posts/new", "/nouvelle-route"];
const ADMIN_ROUTES     = ["/dashboard/admin", "/dashboard/reports"];
```

---

## Bannissement

`isActive: false` sur le document User a pour effet :

- **REST** — `authenticateJWT` retourne `401 "Your account has been suspended."` sur toute requête authentifiée.
- **Socket.IO** — le middleware de connexion charge le user depuis la DB et appelle `next(new Error('Account suspended'))`, empêchant la connexion.
- Un admin ne peut pas bannir un autre admin (vérification dans `banUser`).
- Un admin ne peut pas se bannir lui-même (vérification dans `banUser`).

---

## Ajouter un nouveau endpoint protégé

### Backend

```js
// 1. Authentifié uniquement
router.get('/resource', authenticateJWT, handler);

// 2. Admin seulement
router.delete('/resource/:id', authenticateJWT, authorizeRole('admin'), handler);

// 3. Propriétaire ou admin (post)
router.patch('/posts/:id/flag', authenticateJWT, checkPostOwner(), handler);

// 4. Modèle quelconque
const { checkOwnerOf } = require('../middleware/ownership.middleware');
router.delete('/comments/:id', authenticateJWT, checkOwnerOf(Comment, 'author'), handler);
```

### Frontend

```jsx
// 1. Page protégée (auth)
export default function MyPage() {
  return <UserGuard><MyPageContent /></UserGuard>;
}

// 2. Page admin
export default function AdminPage() {
  return <AdminGuard><AdminPageContent /></AdminGuard>;
}

// 3. Guard flexible
export default function CustomPage() {
  return (
    <RoleGuard require={(u) => u.isEmailVerified}>
      <CustomPageContent />
    </RoleGuard>
  );
}

// 4. Bouton conditionnel
<Show owner={resource.author._id}>
  <DeleteButton />
</Show>
```

Et ajouter la route dans `middleware.js` si elle doit être protégée au niveau edge :

```js
const PROTECTED_ROUTES = [...existingRoutes, "/new-protected-route"];
```
