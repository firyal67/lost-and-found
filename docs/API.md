# REST API Reference

**Base URL (développement)** : `http://localhost:5000/api`  
**Base URL (production)** : `https://backend-service-production-ac47.up.railway.app/api`

## Conventions

### Authentification

Les routes protégées nécessitent un token JWT dans le header :
```
Authorization: Bearer <access_token>
```

L'access token expire après **15 minutes**. Utiliser `POST /auth/refresh` pour le renouveler via le cookie `refreshToken`.

### Format de réponse

**Succès :**
```json
{
  "success": true,
  "data": { ... },
  "message": "Description optionnelle"
}
```

**Erreur :**
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [{ "field": "email", "message": "Email invalide" }]
}
```

### Codes HTTP

| Code | Signification |
|---|---|
| 200 | Succès |
| 201 | Ressource créée |
| 400 | Requête invalide (ID malformé, contrainte métier) |
| 401 | Non authentifié |
| 403 | Accès refusé (rôle insuffisant ou non propriétaire) |
| 404 | Ressource introuvable |
| 409 | Conflit (doublon, état incompatible) |
| 422 | Validation échouée |
| 429 | Trop de requêtes (rate limit atteint) |
| 500 | Erreur serveur interne |

### Rate Limiting

| Route | Limite |
|---|---|
| `POST /auth/*` | 20 req / 15 min |
| `POST /posts` | 10 req / heure |
| `POST /reports` | 20 req / heure |
| `POST /contacts` | 15 req / heure |
| Actions admin (ban/unban) | 60 req / 15 min |
| Toutes les autres routes | 200 req / 15 min |

En cas de dépassement, la réponse 429 inclut :
```json
{ "success": false, "message": "...", "retryAfter": 840 }
```

---

## Authentification — `/api/auth`

### POST /auth/register

Crée un nouveau compte utilisateur et envoie un email de vérification.

**Body :**
```json
{
  "name": "Ahmed Ben Ali",
  "email": "ahmed@example.com",
  "password": "MonMotDePasse1"
}
```

Règles : `name` 2–50 chars · `password` ≥ 8 chars avec majuscule, minuscule et chiffre.

**Réponse 201 :**
```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "name": "Ahmed Ben Ali", "email": "ahmed@example.com", "role": "user" },
    "accessToken": "eyJ...",
    "emailPreviewUrl": "https://ethereal.email/..." 
  }
}
```
> `emailPreviewUrl` présent uniquement en développement (Ethereal).

---

### POST /auth/login

**Body :**
```json
{
  "email": "ahmed@example.com",
  "password": "MonMotDePasse1"
}
```

**Réponse 200 :** Même format que `/register`. Pose le cookie `refreshToken` (httpOnly).

---

### POST /auth/refresh

Échange le cookie `refreshToken` contre un nouvel `accessToken`. Pas de body.

**Réponse 200 :**
```json
{ "success": true, "data": { "accessToken": "eyJ..." } }
```

---

### POST /auth/logout

Révoque le refresh token courant et efface le cookie. Pas de body.

**Réponse 200 :** `{ "success": true, "message": "Logged out successfully." }`

---

### GET /auth/me 🔒

Retourne le profil de l'utilisateur connecté.

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...", "name": "...", "email": "...", "role": "user",
      "isActive": true, "isEmailVerified": false, "createdAt": "..."
    }
  }
}
```

---

### GET /auth/verify-email/:token

Vérifie l'adresse email via le token reçu par mail.

**Réponse 200 :** `{ "success": true, "message": "Email verified successfully." }`  
**Réponse 400 :** Lien invalide ou expiré.

---

### POST /auth/resend-verification 🔒

Renvoie l'email de vérification. Échoue si l'email est déjà vérifié.

**Réponse 200 :** `{ "success": true, "message": "Verification email sent." }`

---

### POST /auth/forgot-password

Envoie un lien de réinitialisation. Retourne toujours 200 pour éviter l'énumération d'emails.

**Body :** `{ "email": "ahmed@example.com" }`

**Réponse 200 :** `{ "success": true, "message": "If an account with that email exists, a reset link has been sent." }`

---

### POST /auth/reset-password/:token

Réinitialise le mot de passe. Révoque toutes les sessions existantes.

**Body :**
```json
{
  "password": "NouveauMotDePasse1",
  "confirmPassword": "NouveauMotDePasse1"
}
```

**Réponse 200 :** `{ "success": true, "message": "Password reset successfully." }`  
**Réponse 400 :** Lien invalide ou expiré.

---

## Annonces — `/api/posts`

### GET /posts

Liste les annonces avec filtres et pagination. **Public.**

**Query params :**

| Paramètre | Type | Défaut | Description |
|---|---|---|---|
| `type` | `lost` \| `found` | — | Type d'annonce |
| `objectType` | `cin` \| `passport` \| `permis` \| `carte_bancaire` \| `telephone` \| `cles` \| `autre` | — | Type d'objet |
| `city` | string | — | Ville (ex : `Tunis`) |
| `dateFrom` | ISO date | — | Date de l'événement — début |
| `dateTo` | ISO date | — | Date de l'événement — fin |
| `q` | string | — | Recherche plein texte |
| `status` | `active` \| `resolved` \| `archived` \| `matched` \| `all` | `active` | Statut des annonces |
| `sort` | `date` \| `-date` | `-date` | Tri par date |
| `page` | integer | `1` | Page |
| `limit` | integer | `20` | Résultats par page (max 100) |

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "posts": [ { "_id": "...", "type": "lost", "title": "...", "city": "Tunis", ... } ],
    "pagination": { "total": 42, "page": 1, "limit": 12, "pages": 4 }
  }
}
```

---

### GET /posts/matches

Suggestions de correspondance lors de la création d'une annonce. **Public.**

**Query params :** `type`, `objectType`, `city`, `delegation`, `date`, `title`, `description`

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      { "_id": "...", "title": "...", "matchScore": 85, "matchBreakdown": { "objectType": 40, "city": 25, ... } }
    ]
  }
}
```

---

### GET /posts/:id

Détail d'une annonce. **Public.**

**Réponse 200 :** `{ "success": true, "data": { "post": { ... } } }`  
**Réponse 404 :** Annonce introuvable.

---

### GET /posts/:id/matches

Correspondances pour une annonce existante. **Public.**

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "source": { "_id": "...", "type": "lost", "objectType": "cin", "city": "Tunis", "date": "..." },
    "matches": [ { "_id": "...", "matchScore": 75, ... } ]
  }
}
```

---

### POST /posts 🔒

Crée une nouvelle annonce. Limité à **10 par heure**.

**Body :**
```json
{
  "type": "lost",
  "objectType": "cin",
  "title": "CIN perdue à Tunis",
  "description": "Perdue samedi matin près du marché central.",
  "city": "Tunis",
  "delegation": "Bab Bhar",
  "date": "2026-07-20",
  "maskedDocNumber": "****1234",
  "photo": "data:image/jpeg;base64,...",
  "reward": 50,
  "contactPreferences": { "phone": false, "email": true, "platform": true },
  "contactEmail": "ahmed@example.com",
  "contactPhone": "+216 20 000 000"
}
```

Champs obligatoires : `type`, `objectType`, `title`, `description`, `city`, `date`  
La description ne peut pas contenir de numéro de document complet (ex: `12345678`).

**Réponse 201 :** `{ "success": true, "data": { "post": { ... } } }`

---

### PATCH /posts/:id 🔒 (owner ou admin)

Modifie une annonce active. Tous les champs sont optionnels.

**Body :** Mêmes champs que POST (sauf `type` qui n'est pas modifiable).

**Réponse 200 :** `{ "success": true, "data": { "post": { ... } } }`  
**Réponse 409 :** Seules les annonces actives peuvent être modifiées.

---

### DELETE /posts/:id 🔒 (owner ou admin)

Supprime définitivement une annonce.

**Réponse 200 :** `{ "success": true, "message": "Annonce supprimée avec succès." }`

---

### PATCH /posts/:id/resolve 🔒 (owner ou admin)

Clôture une annonce (status → `resolved`).

**Réponse 200 :** `{ "success": true, "data": { "post": { ... } } }`  
**Réponse 409 :** Annonce déjà clôturée.

---

### PATCH /posts/:id/archive 🔒 (owner ou admin)

Archive une annonce (status → `archived`). Elle disparaît de la liste publique.

**Réponse 200 :** `{ "success": true, "data": { "post": { ... } } }`

---

### PATCH /posts/:id/match 🔒 (owner ou admin)

Marque une annonce comme mise en correspondance (status → `matched`).

**Body (optionnel) :** `{ "matchedWith": "<postId>" }`

**Réponse 200 :** `{ "success": true, "data": { "post": { ... } } }`

---

## Contacts — `/api/contacts`

### POST /contacts 🔒

Envoie une demande de contact pour une annonce. Limité à **15 par heure**.

**Body :**
```json
{
  "postId": "...",
  "message": "Bonjour, j'ai peut-être trouvé votre objet."
}
```

**Réponse 201 :** `{ "success": true, "data": { "contact": { ... } } }`  
**Réponse 409 :** Demande déjà envoyée pour cette annonce.

---

### GET /contacts 🔒

Retourne les demandes de contact de l'utilisateur (reçues et envoyées).

**Query params :**

| Paramètre | Valeurs | Description |
|---|---|---|
| `role` | `owner` \| `requester` | Filtrer par rôle (défaut : les deux) |
| `status` | `pending` \| `approved` \| `rejected` | Filtrer par statut |

**Réponse 200 :** `{ "success": true, "data": { "contacts": [...], "total": 5 } }`

---

### GET /contacts/post/:postId 🔒

Vérifie si l'utilisateur a déjà envoyé une demande pour une annonce.

**Réponse 200 :** `{ "success": true, "data": { "contact": null } }` ou `{ "data": { "contact": { ... } } }`

---

### PATCH /contacts/:id/approve 🔒 (owner de l'annonce ou admin)

Approuve une demande et révèle les coordonnées du propriétaire au demandeur.

**Réponse 200 :** `{ "success": true, "data": { "contact": { "revealedEmail": "...", ... } } }`

---

### PATCH /contacts/:id/reject 🔒 (owner de l'annonce ou admin)

Rejette une demande de contact.

**Réponse 200 :** `{ "success": true, "data": { "contact": { "status": "rejected" } } }`

---

## Signalements — `/api/reports`

### POST /reports 🔒

Signale une annonce. Limité à **20 par heure**.

**Body :**
```json
{
  "postId": "...",
  "reason": "spam",
  "comment": "Cette annonce est identique à une autre publiée hier."
}
```

Valeurs de `reason` : `spam`, `scam`, `misleading`, `inappropriate`, `duplicate`, `other`

**Réponse 201 :** `{ "success": true, "data": { "report": { ... } } }`  
**Réponse 409 :** Annonce déjà signalée par cet utilisateur.

---

### GET /reports/mine 🔒

Retourne les signalements envoyés par l'utilisateur connecté.

**Réponse 200 :** `{ "success": true, "data": { "reports": [...], "total": 3 } }`

---

### GET /reports/post/:postId/mine 🔒

Vérifie si l'utilisateur a déjà signalé une annonce spécifique.

**Réponse 200 :** `{ "success": true, "data": { "reported": true, "report": { ... } } }`

---

### GET /reports 🔒🛡️ (admin)

Liste tous les signalements avec pagination.

**Query params :**

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `status` | `pending` \| `reviewed` \| `actioned` \| `dismissed` \| `all` | `pending` |
| `page` | integer | `1` |
| `limit` | integer | `20` |

**Réponse 200 :** `{ "success": true, "data": { "reports": [...], "pagination": { ... } } }`

---

### PATCH /reports/:id/status 🔒🛡️ (admin)

Met à jour le statut d'un signalement.

**Body :**
```json
{
  "status": "actioned",
  "adminNote": "Annonce supprimée — contenu frauduleux confirmé."
}
```

Valeurs de `status` : `pending`, `reviewed`, `actioned`, `dismissed`

**Réponse 200 :** `{ "success": true, "data": { "report": { ... } } }`

---

### DELETE /reports/:id/post 🔒🛡️ (admin)

Supprime l'annonce liée à un signalement et clôture tous les signalements associés.

**Réponse 200 :** `{ "success": true, "message": "Annonce supprimée et signalements clôturés.", "data": { "postId": "..." } }`

---

## Chat (REST fallback) — `/api/chat`

> La messagerie en temps réel passe par Socket.IO. Ces endpoints sont un fallback REST.

### GET /chat/:contactId/messages 🔒 (participant)

Historique des messages d'une conversation approuvée. Marque les messages non lus comme lus.

**Query params :**

| Paramètre | Description |
|---|---|
| `limit` | Nombre de messages (défaut 50, max 100) |
| `before` | ISO date — messages antérieurs à cette date (pagination curseur) |

**Réponse 200 :** `{ "success": true, "data": { "messages": [...], "contactId": "..." } }`

---

### POST /chat/:contactId/messages 🔒 (participant)

Envoie un message (fallback si Socket.IO indisponible).

**Body :** `{ "content": "Bonjour !" }`

**Réponse 201 :** `{ "success": true, "data": { "message": { "_id": "...", "content": "...", "sender": { ... } } } }`

---

### GET /chat/:contactId/unread 🔒 (participant)

Nombre de messages non lus dans une conversation.

**Réponse 200 :** `{ "success": true, "data": { "unread": 3 } }`

---

## Upload — `/api/upload`

### POST /upload 🔒

Upload d'une image. Limité à **10 par heure**.

**Content-Type :** `multipart/form-data`  
**Champ :** `photo` (JPEG, PNG, WebP, GIF · max 5 Mo)

**Réponse 201 :**
```json
{
  "success": true,
  "data": { "url": "http://localhost:5000/uploads/1720000000-abc123.jpg" }
}
```

---

## Administration — `/api/admin` 🔒🛡️ (admin uniquement)

Toutes les routes nécessitent `role === "admin"`.

### GET /admin/users

Liste paginée des utilisateurs.

**Query params :**

| Paramètre | Description |
|---|---|
| `q` | Recherche par nom ou email |
| `role` | `user` \| `admin` |
| `status` | `active` \| `banned` |
| `page` | Défaut 1 |
| `limit` | Défaut 20, max 100 |

**Réponse 200 :** `{ "success": true, "data": { "users": [...], "pagination": { ... } } }`

---

### PATCH /admin/users/:id/ban

Bannit un utilisateur (isActive → false) et révoque toutes ses sessions.

**Body (optionnel) :** `{ "reason": "Spam répété" }`

**Réponse 200 :** `{ "success": true, "message": "Utilisateur ... banni avec succès." }`  
**Réponse 400 :** Auto-bannissement tentés.  
**Réponse 403 :** Impossible de bannir un autre admin.

---

### PATCH /admin/users/:id/unban

Réactive un compte banni.

**Réponse 200 :** `{ "success": true, "message": "Compte de ... réactivé." }`

---

### GET /admin/metrics

Métriques globales de la plateforme.

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "totals": { "users": 140, "posts": 320, "reports": 12, "contacts": 87 },
    "posts": { "active": 210, "resolved": 80, "matched": 30 },
    "reports": { "pending": 5, "actioned": 7 },
    "activity": [ { "date": "2026-07-28", "posts": 8, "contacts": 3 } ]
  }
}
```

---

### GET /admin/audit-log

Journal de toutes les actions de modération.

**Query params :**

| Paramètre | Description |
|---|---|
| `action` | Filtrer par type : `user.ban`, `user.unban`, `report.reviewed`, `report.actioned`, `report.dismissed`, `post.deleted`, `post.archived` |
| `adminId` | Filtrer par admin |
| `page` | Défaut 1 |
| `limit` | Défaut 20, max 100 |

**Réponse 200 :**
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "_id": "...",
        "action": "user.ban",
        "performedBy": { "_id": "...", "name": "Admin", "email": "admin@..." },
        "targetUser": { "_id": "...", "name": "...", "email": "..." },
        "details": { "reason": "Spam" },
        "ip": "1.2.3.4",
        "createdAt": "2026-07-28T10:00:00.000Z"
      }
    ],
    "pagination": { "total": 15, "page": 1, "limit": 20, "pages": 1 }
  }
}
```

---

## Socket.IO — Messagerie temps réel

**URL :** `NEXT_PUBLIC_SOCKET_URL` (ex: `http://localhost:5000`)

### Authentification

```js
const socket = io(SOCKET_URL, {
  auth: { token: accessToken }
});
```

Le middleware Socket.IO vérifie le JWT, charge l'utilisateur depuis la DB, et rejette les comptes bannis.

### Événements client → serveur

| Événement | Payload | Description |
|---|---|---|
| `join_conversation` | `{ contactId }` | Rejoindre une salle de conversation |
| `leave_conversation` | `{ contactId }` | Quitter une salle |
| `send_message` | `{ contactId, content, tempId }` | Envoyer un message |
| `typing` | `{ contactId, isTyping }` | Indicateur de frappe |

### Événements serveur → client

| Événement | Payload | Description |
|---|---|---|
| `new_message` | `{ ...message, tempId }` | Nouveau message dans la salle |
| `message_error` | `{ tempId, error }` | Échec d'envoi |
| `typing` | `{ userId, isTyping }` | Autre participant en train d'écrire |

> `tempId` permet au sender de réconcilier son message optimiste avec le message persisté.
