# S0-03 — Parcours Utilisateurs et Navigation

## Cartographie des pages

```
/                           ← Accueil (public)
/posts                      ← Liste des annonces (public)
/posts/[id]                 ← Détail d'une annonce (public)
/auth/register              ← Inscription
/auth/login                 ← Connexion
/auth/forgot-password       ← Mot de passe oublié
/auth/reset-password        ← Réinitialisation
/posts/new                  ← Créer une annonce (auth)
/posts/[id]/edit            ← Modifier une annonce (auth + owner)
/dashboard                  ← Tableau de bord utilisateur (auth)
/dashboard/posts            ← Mes annonces
/dashboard/contacts         ← Mes demandes de contact
/admin                      ← Dashboard admin (admin)
/admin/reports              ← Signalements à traiter
/admin/users                ← Gestion des utilisateurs
/admin/stats                ← Métriques
```

## Parcours 1 — Déclarer un objet perdu

```
Accueil → [Bouton "Déclarer une perte"]
  → Non connecté ? → /auth/login → retour formulaire
  → Connecté → /posts/new (type=lost)
    → Remplir formulaire → Validation → Soumission
    → Suggestions de correspondances (matching)
    → Redirection vers /posts/[id]
```

## Parcours 2 — Déclarer un objet trouvé

```
Accueil → [J'ai trouvé un objet]
  → /posts/new (type=found) → Formulaire → /posts/[id]
```

## Parcours 3 — Rechercher / Parcourir

```
Accueil → [Rechercher]
  → /posts?q=...&type=lost&city=Tunis&objectType=cin
    → Liste paginée avec filtres
    → Cliquer → /posts/[id] → [Contacter]
```

## Parcours 4 — Contacter un déclarant

```
/posts/[id] → [Contacter]
  → Auth requis → Modal → POST /api/contacts
    → Propriétaire : /dashboard/contacts → Approuver / Refuser
      → Si approuvé → coordonnées révélées
```

## Parcours 5 — Gérer ses annonces

```
/dashboard/posts → Modifier / Marquer résolu / Archiver
```

## Parcours 6 — Modération Admin

```
/admin/reports → Voir signalement → Supprimer annonce / Bannir user
```

## États d'authentification

| Route | Visiteur | User | Admin |
|---|---|---|---|
| `/` | ✓ | ✓ | ✓ |
| `/posts` | ✓ | ✓ | ✓ |
| `/posts/[id]` | ✓ | ✓ | ✓ |
| `/posts/new` | redirect login | ✓ | ✓ |
| `/dashboard/*` | redirect login | ✓ | ✓ |
| `/admin/*` | redirect login | 403 | ✓ |
