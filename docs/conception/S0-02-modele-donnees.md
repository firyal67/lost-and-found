# S0-02 — Modèle de Données MongoDB et Relations

## Collections

### 1. `users`

```js
{
  _id: ObjectId,
  name: String,           // 2–50 chars
  email: String,          // unique, lowercase
  password: String,       // bcrypt, select: false
  role: "user" | "admin",
  isEmailVerified: Boolean,
  isActive: Boolean,      // false = banni
  refreshTokens: [String],// select: false
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `posts`

```js
{
  _id: ObjectId,
  type: "lost" | "found",
  objectType: "cin" | "passport" | "permis" | "carte_bancaire" | "telephone" | "cles" | "autre",
  title: String,
  description: String,
  city: String,
  delegation: String,
  date: Date,
  photo: String,          // URL (optionnel)
  reward: Number,         // optionnel
  contactPreferences: {
    phone: Boolean,
    email: Boolean,
    platform: Boolean
  },
  maskedDocNumber: String, // ex: "****1234" — jamais le numéro complet
  status: "active" | "matched" | "resolved" | "archived",
  author: ObjectId,       // ref: users
  resolvedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `contacts`

```js
{
  _id: ObjectId,
  post: ObjectId,         // ref: posts
  requester: ObjectId,    // ref: users
  owner: ObjectId,        // ref: users
  status: "pending" | "approved" | "rejected",
  message: String,
  revealedEmail: String,  // révélé si approved
  revealedPhone: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4. `reports`

```js
{
  _id: ObjectId,
  post: ObjectId,         // ref: posts
  reportedBy: ObjectId,   // ref: users
  reason: "spam" | "arnaque" | "inapproprie" | "autre",
  description: String,
  status: "pending" | "reviewed" | "dismissed",
  reviewedBy: ObjectId,   // ref: users (admin)
  reviewedAt: Date,
  createdAt: Date
}
```

## Relations

```
users ──< posts          (1 user → N posts)
users ──< contacts       (1 user → N demandes envoyées)
posts ──< contacts       (1 post → N demandes de contact)
posts ──< reports        (1 post → N signalements)
users ──< reports        (1 user → N signalements émis)
```

## Index MongoDB

```js
// users
{ email: 1 }            // unique

// posts
{ city: 1 }
{ objectType: 1 }
{ date: -1 }
{ status: 1 }
{ author: 1 }
{ city: 1, objectType: 1, date: -1 }  // index composé recherche/filtres

// contacts
{ post: 1, requester: 1 }  // unique
{ owner: 1, status: 1 }

// reports
{ status: 1 }
{ post: 1 }
```

## Règles de confidentialité (US-16/17)

- `maskedDocNumber` stocke uniquement la version masquée (ex: `****5678`)
- Le numéro complet n'est jamais stocké en base
- Validation backend : regex bloque tout numéro CIN/passeport complet dans `description`
