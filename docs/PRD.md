# PRD — ClubOS MVP

## Vision
Aider les clubs sportifs amateurs à se structurer et se professionnaliser en simplifiant la gestion quotidienne pour tous les acteurs du club.

## Hors périmètre
- L'app ne reconstruit pas WhatsApp — elle génère des messages à partager
- L'app ne gère pas les paiements en ligne au MVP (cotisations saisies manuellement)
- L'app n'a pas de messagerie temps réel (pas de WebSocket au MVP)
- Pas de gestion de compte mineur / représentant légal
- Pas de bibliothèque d'exercices au MVP
- Pas de features AI au MVP
- Pas de boutique / merchandising au MVP
- Pas de gamification au MVP

---

## Authentification
- Méthode principale : Email (magic link ou mot de passe) via Better-Auth
- OTP SMS via téléphone : V2

---

## Rôles & Permissions

### Définition des rôles
- **User** : licencié du club (joueur, parent)
- **Manager Sportif** : encadrant / coach — gère son équipe sportivement
- **Manager Associatif** : bureau / bénévole — gère la vie associative
- **Admin** : bureau restreint / employé — accès complet

### Règles de cumul
- Un utilisateur appartient à UN seul club
- Un Manager Sportif ne voit que les équipes qui lui sont assignées
- Le rôle Admin cumule automatiquement les droits Manager Sportif et Manager Associatif

### Matrice des permissions

| Action | User | Manager Sportif | Manager Associatif | Admin |
|---|:---:|:---:|:---:|:---:|
| Voir le calendrier | ✅ | ✅ | ✅ | ✅ |
| Créer un événement | ❌ | ✅ | ✅ | ✅ |
| Créer une convocation | ❌ | ✅ | ❌ | ✅ |
| Marquer les présences | ❌ | ✅ | ❌ | ✅ |
| Saisir les performances | ❌ | ✅ | ❌ | ✅ |
| Publier un message descendant | ❌ | ✅ (équipe) | ❌ | ✅ (club) |
| Poster sur la vitrine | ❌ | ❌ | ❌ | ✅ |
| Gérer les cotisations | ❌ | ❌ | ❌ | ✅ |
| Gérer les licences | ❌ | ❌ | ❌ | ✅ |
| Tableau de bord financier | ❌ | ❌ | ❌ | ✅ |
| Ajouter une dépense | ❌ | ❌ | ✅ | ✅ |
| Gérer les sponsors | ❌ | ❌ | ❌ | ✅ |
| Créer un événement associatif | ❌ | ❌ | ✅ | ✅ |
| Gérer les licenciés | ❌ | ❌ | ❌ | ✅ |
| Gérer les équipes | ❌ | ❌ | ❌ | ✅ |

---

## Modules MVP

### Users — Club
- Calendrier sportif et associatif (vue mensuelle + dropdown équipe)
- Page vitrine (résultats + actualités)
- Messagerie descendante (admins)
- Sondages et questionnaires (inscriptions événements)

### Users — Mon équipe
- Messagerie descendante (manager sportif)
- Convocations / Compositions (lecture)
- Feuille de match (lecture)
- Consultation de contenu partagé par le manager

### Manager Sportif — Mon équipe
- Messagerie (App → message formaté → bouton "Partager sur WhatsApp")
- Création de convocation + composition
- Remplissage de la feuille de match
- Suivi des présences aux entraînements
- Saisie des performances après match
- Publication de contenu (PDF, lien, note)

### Manager Associatif — Gestion associative
- Ajout d'une dépense avec justificatif photo
- Création d'événement avec todo list + gestion des inscrits
- Assignation de tâches à des bénévoles

### Admin — Gestion Associative
- Tableau de bord financier global
- Gestion des dépenses
- Gestion financière des sponsors
- Gestion des cotisations / inscriptions / licences
- CRUD Licenciés
- CRUD Équipes

### Admin — Gestion Club
- Calendrier (ajout manuel + correction)
- Poster / corriger un résultat sur la page vitrine
- Messagerie descendante vers tous les licenciés

---

## Flux critiques

### Flux : Convocation
1. Manager Sportif sélectionne un événement
2. Sélectionne les joueurs → crée les entrées convocations
3. Génère le message formaté
4. Bouton WhatsApp → deep link avec message pré-rempli
5. Notification push envoyée à chaque joueur convoqué

### Flux : Suivi des présences
1. Manager Sportif ouvre un entraînement
2. Marque chaque joueur présent / absent
3. Données enregistrées et visibles dans le suivi individuel

### Flux : Dépense (Manager Associatif)
1. Manager Associatif ajoute une dépense
2. Photo du justificatif uploadée
3. Catégorie sélectionnée
4. Dépense visible dans le tableau de bord Admin

### Flux : Cotisation
1. Admin crée une cotisation pour un licencié
2. Statut : en attente → payé / en retard
3. Mise à jour manuelle du statut par l'Admin

---

## V2+ (Hors scope MVP)
- Authentification OTP SMS
- Bibliothèque d'exercices et plans d'entraînement
- Features ✨ AI (génération de séance, résumé de match, chat financier)
- Boutique / merchandising
- Import automatique calendrier fédération
- Publication automatique réseaux sociaux
- Gamification (badges, streaks, Man of the Match)
- Relances automatiques de cotisations
- Page vitrine publique sans compte
- Espace événements : covoiturage
