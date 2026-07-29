# Scénario de démonstration — Lost & Found Tunisia

**Durée estimée :** 15–20 minutes  
**URL :** http://localhost:3000  
**Objectif :** Parcourir les flux principaux de la plateforme de bout en bout

---

## Comptes disponibles

| Rôle | Nom | Email | Mot de passe |
|---|---|---|---|
| Admin | Guehis Firyal | feryelguehis86@gmail.com | Admin123! |
| Utilisateur 1 | Sami Mejri | sami.mejri@demo.tn | Demo1234! |
| Utilisateur 2 | Leila Mansour | leila.mansour@demo.tn | Demo1234! |

---

## Partie 1 — Visiteur non connecté (2 min)

### 1.1 Page d'accueil

→ Ouvrir **http://localhost:3000**

Montrer :
- Le hero avec les statistiques de la plateforme
- Les 3 étapes : Déclarez → Recherchez → Contactez
- Les boutons "Voir les annonces" et "Publier une annonce"

---

### 1.2 Parcourir les annonces (public)

→ Cliquer **Annonces** dans la navigation ou aller sur **http://localhost:3000/posts**

Montrer :
- La grille d'annonces avec photos et badges (Perdu / Trouvé)
- La **pagination** en bas — boutons numérotés, sélecteur "par page"
- La **barre de recherche** — taper `CIN` → les annonces de cartes s'affichent
- Le bouton **Filtres** → ouvrir le panneau, filtrer par ville `Tunis`
- Cliquer sur une annonce → page de détail

**Point à souligner :** Les visiteurs peuvent consulter toutes les annonces sans compte.

---

## Partie 2 — Inscription et connexion (3 min)

### 2.1 Créer un compte

→ Cliquer **Créer un compte**

Montrer :
- Le formulaire avec **validation en temps réel**
- Taper un mot de passe faible `password` → erreur instantanée
- Taper un email invalide → erreur
- Compléter avec des données valides et soumettre
- L'écran de confirmation d'email

---

### 2.2 Se connecter comme Sami (utilisateur 1)

→ Aller sur **http://localhost:3000/auth/login**

```
Email    : sami.mejri@demo.tn
Password : Demo1234!
```

→ Le dashboard apparaît avec le nom "Sami Mejri"

**Point à souligner :** La session persiste — rafraîchir la page, Sami reste connecté.

---

## Partie 3 — Publier une annonce (3 min)

→ Cliquer **Nouvelle annonce** (bouton header ou dashboard)

**Scénario :** Sami a perdu son portefeuille à Sfax

**Étape 1 — Type :**
- Sélectionner **Perdu**
- Sélectionner **Autre** comme type d'objet

**Étape 2 — Détails :**
- Titre : `Portefeuille perdu marché central Sfax`
- Description : `Portefeuille en cuir marron perdu samedi matin au marché central de Sfax. Contient des papiers importants.`
- Montrer le **warning** en tapant un numéro complet dans la description → refus automatique
- Photo : uploader une image depuis l'ordinateur

**Étape 3 — Lieu & Date :**
- Ville : `Sfax`
- Date : hier
- L'algorithme de **correspondance** s'active → des suggestions apparaissent en temps réel à droite

**Étape 4 — Contact :**
- Activer "Par email"
- Activer "Récompense" → saisir `50`

→ Cliquer **Publier**

**Point à souligner :** L'algorithme de matching suggère automatiquement des annonces correspondantes.

---

## Partie 4 — Demande de contact (2 min)

→ Se déconnecter, puis se connecter comme **Leila**

```
Email    : leila.mansour@demo.tn
Password : Demo1234!
```

→ Aller sur **http://localhost:3000/posts**  
→ Cliquer sur l'annonce **"Carte CIN perdue à Tunis Médina"** (de Sami)  
→ Cliquer **Contacter** sur la page de détail

Montrer :
- Le formulaire de message : `"Bonjour, j'ai peut-être trouvé votre CIN près de la mosquée Zitouna"`
- Soumettre → confirmation

---

## Partie 5 — Gérer les contacts (2 min)

→ Se déconnecter, reconnecter comme **Sami**

→ Aller sur **Dashboard → Contacts**

Montrer :
- La demande de Leila apparaît dans l'onglet "Reçues"
- Le message de Leila
- Cliquer **Approuver** → les coordonnées de Sami sont partagées avec Leila
- Le statut passe à "Approuvée"

**Point à souligner :** Les coordonnées ne sont révélées qu'après approbation — protection de la vie privée.

---

## Partie 6 — Signaler une annonce (1 min)

→ Rester connecté comme Sami  
→ Naviguer vers une annonce d'une autre personne  
→ Cliquer **Signaler**

Montrer :
- Le formulaire : raison `Spam`, commentaire optionnel
- Soumettre → confirmation

---

## Partie 7 — Interface d'administration (5 min)

→ Se déconnecter, reconnecter comme **Admin**

```
Email    : feryelguehis86@gmail.com
Password : Admin123!
```

---

### 7.1 Dashboard admin

→ Aller sur **http://localhost:3000/dashboard**

Montrer :
- Le badge **Admin** dans le header
- Les 4 cartes supplémentaires : Signalements, Utilisateurs, Métriques, Journal d'audit

---

### 7.2 Métriques

→ Cliquer **Métriques**

Montrer :
- Les compteurs (utilisateurs, annonces, contacts, signalements)
- Le graphique d'activité des 30 derniers jours

---

### 7.3 Modérer les signalements

→ Cliquer **Signalements** dans le dashboard

Montrer :
- Le signalement en attente
- Cliquer **Traiter en détail** → modal avec statut + note admin
- Changer le statut en `Examiné` avec une note
- Ou cliquer **Approuver** (rejet du signalement) / **Supprimer l'annonce** (action)

---

### 7.4 Gérer les utilisateurs

→ Cliquer **Utilisateurs**

Montrer :
- La liste paginée avec rôles et statuts
- La recherche par nom ou email
- Filtres par rôle et statut
- Cliquer **Bannir** sur un compte de test → modal avec champ "Raison"
- Le compte passe en statut "Banni" — toutes ses sessions révoquées

---

### 7.5 Journal d'audit

→ Cliquer **Journal d'audit**

Montrer :
- Toutes les actions de modération enregistrées (bannissement vient d'apparaître)
- Le filtre par type d'action
- Chaque entrée : qui a agi, sur qui, quand, depuis quelle IP

**Point à souligner :** Traçabilité complète et immuable — aucune entrée ne peut être modifiée.

---

## Partie 8 — Responsive mobile (1 min)

→ Ouvrir les DevTools (F12) → mode mobile (Ctrl+Shift+M) → iPhone SE

Montrer :
- Le **menu hamburger** → tous les liens présents
- La grille d'annonces en **1 colonne**
- Les filtres en **2 colonnes**
- La pagination mobile : `1 / 2`
- Les boutons d'action sur les cartes **toujours visibles** (sans hover)

---

## Points forts à mentionner pendant la démo

| Fonctionnalité | Ce qu'il faut montrer |
|---|---|
| **Sécurité** | Validation des inputs, XSS bloqué, cookies httpOnly, rate limiting |
| **RBAC** | Non-admin → écran 403 sur `/dashboard/reports` |
| **Session** | Rafraîchissement automatique du token (transparent pour l'utilisateur) |
| **Matching** | Suggestions en temps réel lors de la création |
| **Audit** | Chaque action admin est tracée et non modifiable |
| **Pagination** | URL synchronisée (`?page=2&limit=24`) — lien partageable |

---

## En cas de question sur la sécurité

Essayer d'accéder à `/dashboard/reports` **sans être connecté** → redirection vers `/auth/login`  
Essayer avec le compte Sami (non-admin) → écran **"Accès refusé"** avec bouton retour

---

## Données présentes pour la démo

| Type | Quantité |
|---|---|
| Annonces | 27 (dont 5 spécifiques à la démo) |
| Utilisateurs | 16 (dont 2 comptes démo + 1 admin) |
| Demandes de contact | 3 |
| Signalements | 2 |
| Entrées journal d'audit | Selon les actions effectuées |
