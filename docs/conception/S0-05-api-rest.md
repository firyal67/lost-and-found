# S0-05 — Contrats API REST

Base URL : `http://localhost:5000/api`

```json
{ "success": true,  "data": {...} }
{ "success": false, "message": "...", "errors": [...] }
```

## Auth — `/api/auth`

| Méthode | Endpoint | Auth |
|---|---|---|
| POST | `/register` | — |
| POST | `/login` | — |
| POST | `/logout` | ✓ |
| POST | `/refresh` | Cookie |
| POST | `/forgot-password` | — |
| POST | `/reset-password` | Token |

## Posts — `/api/posts`

| Méthode | Endpoint | Auth |
|---|---|---|
| GET | `/` | — |
| GET | `/:id` | — |
| POST | `/` | ✓ |
| PUT | `/:id` | ✓ owner |
| PATCH | `/:id/status` | ✓ owner |
| DELETE | `/:id` | ✓ owner/admin |
| GET | `/:id/matches` | ✓ |

### Filtres GET /posts
```
?type=lost|found &objectType=cin|passport|...
&city=Tunis &dateFrom=... &dateTo=...
&q=mots-clés &sort=date|-date|relevance
&page=1 &limit=20
```

## Contacts — `/api/contacts`

| Méthode | Endpoint | Auth |
|---|---|---|
| POST | `/` | ✓ |
| GET | `/` | ✓ |
| PATCH | `/:id` | ✓ owner |

## Reports — `/api/reports`

| Méthode | Endpoint | Auth |
|---|---|---|
| POST | `/` | ✓ |
| GET | `/` | ✓ admin |
| PATCH | `/:id` | ✓ admin |

## Admin — `/api/admin`

| Méthode | Endpoint | Auth |
|---|---|---|
| GET | `/users` | ✓ admin |
| PATCH | `/users/:id/ban` | ✓ admin |
| PATCH | `/users/:id/unban` | ✓ admin |
| GET | `/stats` | ✓ admin |
| GET | `/audit` | ✓ admin |

## Codes HTTP

| Code | Signification |
|---|---|
| 200 | OK |
| 201 | Créé |
| 401 | Non authentifié |
| 403 | Accès refusé |
| 404 | Introuvable |
| 409 | Conflit (doublon) |
| 422 | Validation échouée |
| 429 | Rate limit |
| 500 | Erreur serveur |
