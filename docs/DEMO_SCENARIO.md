# Scénario de Démonstration — Lost & Found Tunisie

## Contexte

Plateforme de déclaration d'objets perdus et trouvés en Tunisie.  
**Frontend :** https://frontend-woad-nine-29.vercel.app  
**Backend API :** https://backend-service-production-ac47.up.railway.app

---

## Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Admin | feryelguehis86@gmail.com | Admin123!! |
| Utilisateur | ahmed@example.com | User1234! |
| Utilisatrice | sarra@example.com | User1234! |
| Utilisateur | mohamed@example.com | User1234! |

---

## 1. PARCOURS VISITEUR (non connecté)

### 1.1 Page d'accueil
- Ouvrir https://frontend-woad-nine-29.vercel.app
- **Montrer :** Hero section avec titre "Retrouvez ce qui compte pour vous"
- **Montrer :** Les 3 étapes — Déclarez → Recherchez → Contactez
- **Montrer :** Les statistiques (annonces, objets retrouvés, utilisateurs)
- **Montrer :** CTA "Créer un compte gratuit" et "Voir les annonces"

### 1.2 Parcourir les annonces
- Cliquer sur **"Voir les annonces"** ou naviguer vers `/posts`
- **Montrer :** La liste paginée des 22 annonces avec titre, type (perdu/trouvé), ville, date
- **Montrer :** Les filtres :
  - Filtre par type : **Perdu** / **Trouvé**
  - Filtre par catégorie d'objet : Téléphone, CIN, Clés, etc.
  - Filtre par ville : Tunis, Sfax, Sousse, Bizerte, etc.
  - Recherche textuelle
- **Montrer :** La pagination

### 1.3 Détail d'une annonce
- Cliquer sur une annonce → `/posts/[id]`
- **Montrer :** Les informations complètes (titre, description, ville, délégation, date, récompense)
- **Montrer :** Les préférences de contact (téléphone, email, plateforme)
- **Montrer :** Le bouton **"Contacter l'auteur"** (redirige vers connexion si non connecté)
- **Montrer :** La section **"Annonces similaires"** (suggestions basées sur l'algorithme de matching)

---

## 2. INSCRIPTION & CONNEXION

### 2.1 Inscription
- Aller sur `/auth/register`
- **Montrer :** Le formulaire avec nom, email, mot de passe
- **Montrer :** Les validations (mot de passe 8+ caractères avec majuscule, minuscule, chiffre)
- Créer un nouveau compte (ou utiliser un compte existant)

### 2.2 Connexion
- Aller sur `/auth/login`
- **Montrer :** Le formulaire de connexion
- **Montrer :** Le lien "Mot de passe oublié ?"
- Se connecter avec **ahmed@example.com** / `User1234!`
- **Montrer :** La redirection vers la page d'accueil avec l'état connecté (nom affiché dans le header, boutons "Déposer une annonce" et "Mon compte")

### 2.3 Mot de passe oublié
- **Montrer :** `/auth/forgot-password` — formulaire d'envoi d'email de réinitialisation

---

## 3. PUBLICATION D'UNE ANNONCE (connecté)

### 3.1 Création
- Cliquer sur **"Déclarer un objet"** → `/posts/new`
- **Montrer :** Le formulaire complet :
  - Type : **Perdu** ou **Trouvé**
  - Catégorie d'objet (dropdown : CIN, Passeport, Permis, Téléphone, Clés, etc.)
  - Titre (5-100 caractères)
  - Description (10-1000 caractères) — masquage automatique des numéros de documents
  - Ville (dropdown des villes tunisiennes)
  - Délégation (optionnel)
  - Date de l'événement
  - Numéro de document masqué (optionnel, format `****1234`)
  - Récompense (optionnelle)
  - Photo (upload)
  - Préférences de contact (téléphone, email, plateforme)
- **Montrer :** La section **"Annonces similaires"** qui apparaît automatiquement pendant la saisie, utilisant l'algorithme de matching pour suggérer des correspondances existantes (évite les doublons et aide à trouver une correspondance immédiate)
- Soumettre le formulaire

### 3.2 Modification / Résolution
- Aller sur une annonce que l'on possède
- **Montrer :** Les boutons **Modifier**, **Marquer comme résolu**, **Archiver**, **Supprimer**
- Marquer une annonce comme résolue → statut passe à "résolu"

---

## 4. CONTACT & MESSAGERIE

### 4.1 Demande de contact
- Trouver une annonce (ex: "iPhone 13 perdu au Lac 2")
- Cliquer sur **"Contacter l'auteur"**
- **Montrer :** La modale avec champ message optionnel
- Envoyer la demande

### 4.2 Approuver une demande (propriétaire)
- Aller sur `/dashboard/contacts`
- **Montrer :** Les demandes reçues (onglet "Reçues")
- **Montrer :** Les demandes envoyées (onglet "Envoyées")
- Approuver une demande → les coordonnées sont révélées (email, téléphone)

### 4.3 Messagerie instantanée
- Une fois la demande approuvée, un chat s'ouvre
- **Montrer :** La messagerie temps réel (Socket.IO)
- Envoyer un message — il apparaît instantanément chez le destinataire
- **Montrer :** Les indicateurs de lecture (messages lus/non lus)
- **Montrer :** Le compteur de messages non lus dans le header

---

## 5. SIGNALEMENT D'UNE ANNONCE

- Sur une annonce, cliquer sur **"Signaler"**
- **Montrer :** Le formulaire avec motif (spam, arnaque, trompeur, inapproprié, doublon, autre)
- Ajouter un commentaire optionnel
- Soumettre le signalement
- **Montrer :** Le message de confirmation

---

## 6. PANEL ADMINISTRATEUR

Se connecter avec **feryelguehis86@gmail.com** / `Admin123!!`

### 6.1 Tableau de bord
- Aller sur `/dashboard`
- **Montrer :** Les liens admin dans le menu (visibles uniquement pour le rôle admin)

### 6.2 Gestion des utilisateurs
- Aller sur `/dashboard/admin/users`
- **Montrer :** La liste des utilisateurs avec recherche (nom, email)
- **Montrer :** Les filtres (rôle, statut actif/banni)
- **Montrer :** Les actions **Bannir** / **Débannir** avec motif (journalisé dans l'audit trail)

### 6.3 Métriques
- Aller sur `/dashboard/admin/metrics`
- **Montrer :** Les statistiques globales :
  - Nombre total d'utilisateurs
  - Nombre total d'annonces
  - Annonces perdues vs trouvées
  - Répartition par ville
  - Évolution quotidienne (graphiques)
  - Taux de résolution

### 6.4 Gestion des signalements
- Aller sur `/dashboard/reports`
- **Montrer :** La liste des signalements (statut : en attente, examiné, traité, rejeté)
- **Montrer :** Les actions : marquer comme examiné, supprimer l'annonce signalée, rejeter le signalement

### 6.5 Journal d'audit
- Aller sur `/dashboard/admin/audit-log`
- **Montrer :** La trace de toutes les actions admin (bannissements, traitements de signalements, suppressions)
- **Montrer :** Les filtres par type d'action et par admin

---

## 7. ALGORITHME DE MATCHING (élément différenciant)

### Principe
L'algorithme calcule un score de similarité (0-100) entre deux annonces basé sur 5 critères pondérés :

| Critère | Pondération | Description |
|---------|-------------|-------------|
| Type d'objet | 40 pts | Correspondance exacte de la catégorie |
| Ville | 25 pts | Même ville = score max |
| Délégation | 10 pts | Même délégation = bonus supplémentaire |
| Proximité de date | 15 pts | Plus les dates sont proches, plus le score est élevé |
| Similarité textuelle | 10 pts | Score Jaccard sur les mots-clés du titre |

### Démonstration
- Créer une annonce "iPhone 14 perdu à La Marsa"
- **Montrer :** Les suggestions automatiques qui apparaissent — l'annonce "iPhone 13 perdu au Lac 2" obtient un score élevé (même catégorie, même ville)
- Ouvrir une annonce existante → `/posts/[id]`
- **Montrer :** La section "Annonces similaires" avec les scores de matching

---

## 8. FLUX COMPLET (démo rapide 3 min)

1. Visiteur arrive sur la page d'accueil
2. Parcourt les annonces avec filtres
3. Voit le détail d'une annonce
4. Se connecte (ahmed@example.com)
5. Publie une nouvelle annonce "perdu"
6. Voit les suggestions de matching
7. Contacte l'auteur d'une annonce "trouvé"
8. Bascule sur le compte de l'auteur (sarra@example.com)
9. Approuve la demande de contact
10. Envoie un message dans le chat
11. Marque l'annonce comme résolue
12. (Optionnel) Se connecte en admin et montre les métriques

---

## Points d'attention technique

- **CORS :** Le frontend (Vercel) et le backend (Railway) sont sur des domaines différents — les cookies refreshToken utilisent `SameSite=None; Secure` pour fonctionner en cross-origin
- **Token refresh :** Le access token (15 min) est automatiquement rafraîchi via le refresh token stocké en cookie httpOnly
- **Rate limiting :** 8 limiteurs différents protègent les endpoints sensibles
- **Sécurité :** Les mots de passe sont hachés avec bcrypt (salt rounds 12), les tokens de vérification sont hashés en SHA256 avant stockage
