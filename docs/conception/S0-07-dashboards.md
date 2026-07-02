# S0-07 — Structure des Dashboards

## Dashboard Utilisateur — `/dashboard`

### Sidebar
```
👤 Nom · email
─────────────
📋 Mes annonces    → /dashboard/posts
💬 Mes contacts    → /dashboard/contacts
🔔 Notifications   → /dashboard/notifications
⚙️  Mon profil     → /dashboard/profile
─────────────
🚪 Déconnexion
```

### Page principale
- 3 stats : annonces actives · demandes en attente · correspondances trouvées
- Annonces récentes avec statuts
- Demandes de contact en attente (Approuver / Refuser)

### `/dashboard/posts`
Tableau : titre · type · statut · date · actions (modifier / clôturer / archiver)

### `/dashboard/contacts`
- Onglet **Reçues** — approuver ou refuser
- Onglet **Envoyées** — voir le statut

---

## Dashboard Admin — `/admin`

### Sidebar
```
🛡️ Administration
──────────────────
📊 Vue d'ensemble  → /admin
🚨 Signalements    → /admin/reports
📝 Annonces        → /admin/posts
👥 Utilisateurs    → /admin/users
📈 Statistiques    → /admin/stats
📋 Journal audit   → /admin/audit
```

### Page principale
- 4 stats : posts actifs · signalements en attente · bannis · taux résolution
- Signalements récents avec actions (Voir / Supprimer / Ignorer)
- Graphique d'activité 7 derniers jours

### `/admin/reports`
Tableau : post · motif · signalé par · date · statut
Actions : Supprimer annonce · Ignorer · Bannir l'auteur

### `/admin/users`
Tableau : nom · email · statut · date inscription · nb posts
Actions : Bannir / Débannir

### `/admin/stats`
- Posts par type et par ville (top 10)
- Évolution des inscriptions
- Taux de résolution

---

## Composants partagés

| Composant | Rôle |
|---|---|
| `DashboardLayout` | Sidebar + header + contenu |
| `StatCard` | Carte métrique |
| `DataTable` | Tableau paginé + tri + filtres |
| `StatusBadge` | Badge coloré par statut |
| `ConfirmModal` | Confirmation actions destructives |
