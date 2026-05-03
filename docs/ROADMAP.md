# ROADMAP — ClubOS MVP

## Principes
- Chaque sprint = 1 module fonctionnel livrable
- Ordre dicté par les dépendances techniques (auth avant tout, schema avant les modules)
- Seules les features Must Have du PRD sont dans cette roadmap
- Chaque tâche est formulée pour être donnée directement à Claude Code

## Comment utiliser cette roadmap avec Claude Code
Pour chaque tâche, utilise ce format :
> "En suivant CLAUDE.md, PRD.md et SCHEMA.md, implémente [tâche].
> Contraintes : [rôle requis], [ownership check], [validation Zod]."

Exemple :
> "En suivant CLAUDE.md, PRD.md et SCHEMA.md, implémente la Server Action createConvocation.
> Contraintes : rôle manager requis, vérifier que l'équipe appartient au club de la session, validation Zod sur les champs eventId et userIds."

## Dépendances entre sprints
```
Sprint 1 → requiert Sprint 0 (auth + multi-tenant)
Sprint 2 → requiert Sprint 1 (users + teams existent)
Sprint 3 → requiert Sprint 2 (events existent)
Sprint 4 → requiert Sprint 3 (convocations existent)
Sprint 5 → requiert Sprint 1 (users existent)
Sprint 6 → requiert Sprint 1 (users existent)
```

---

## Sprint 0 — Fondations
> Objectif : projet qui tourne, DB connectée, auth fonctionnelle

- [ ] Initialiser le projet Next.js 16 avec App Router
- [ ] Configurer Tailwind CSS v4
- [ ] Configurer Drizzle + Supabase (PostgreSQL)
- [ ] Créer le schema DB initial (clubs, users, teams)
- [ ] Configurer Better-Auth (session, middleware)
- [ ] Implémenter le flux d'authentification par email (magic link ou mot de passe)
- [ ] Middleware de protection des routes par rôle
- [ ] Middleware multi-tenant (résolution du club via slug/domaine)

### Definition of Done
- [ ] Un utilisateur peut créer un compte via email
- [ ] Un utilisateur peut se connecter et accéder au dashboard
- [ ] Un accès non autorisé redirige vers /login
- [ ] Le clubId est bien résolu depuis la session dans chaque requête

---

## Sprint 1 — Gestion des utilisateurs & du club
> Objectif : un Admin peut gérer son club et ses licenciés

- [ ] CRUD Licenciés (Admin) — ajout, modification, désactivation (soft delete)
- [ ] Gestion des rôles additifs (User implicite + Manager / Admin explicites)
- [ ] CRUD Équipes (Admin) — création, édition, assignation des joueurs
- [ ] Assignation d'un Manager à une équipe
- [ ] Page profil utilisateur (nom, email, équipe, rôles)

### Definition of Done
- [ ] Un Admin peut créer un licencié et lui assigner un ou plusieurs rôles
- [ ] Un Admin peut créer une équipe et y assigner des joueurs
- [ ] Un Manager ne voit que ses équipes assignées
- [ ] Un licencié désactivé ne peut plus se connecter

---

## Sprint 2 — Calendrier & Événements
> Objectif : tous les acteurs voient les événements du club

- [ ] Schema DB : events (match / entraînement / autre)
- [ ] CRUD Événements (Admin + Manager)
- [ ] Vue calendrier mensuelle avec dropdown équipe (Users)
- [ ] Vue hebdomadaire et journalière (Users)
- [ ] Filtrage des événements par équipe et par type
- [ ] Notifications lors de la création d'un événement

### Definition of Done
- [ ] Un Manager peut créer un événement pour son équipe
- [ ] Un User voit uniquement les événements de son équipe
- [ ] Un Admin voit tous les événements du club
- [ ] Le calendrier s'affiche correctement en vue mensuelle et hebdomadaire

---

## Sprint 3 — Convocations & Compositions
> Objectif : Manager peut convoquer et composer son équipe

- [ ] Schema DB : convocations (pending / confirmed / declined)
- [ ] Création d'une convocation liée à un événement (Manager)
- [ ] Sélection des joueurs convoqués
- [ ] Définition de la composition (titulaires / remplaçants)
- [ ] Génération du message formaté pour WhatsApp
- [ ] Bouton "Partager sur WhatsApp" (deep link wa.me)
- [ ] Vue convocation côté User (match, horaire, lieu, statut)
- [ ] Notification push à la réception d'une convocation

### Definition of Done
- [ ] Un Manager peut créer une convocation et sélectionner ses joueurs
- [ ] Le bouton WhatsApp génère un message pré-rempli correct
- [ ] Un User voit sa convocation avec le bon statut
- [ ] Un joueur non convoqué ne voit pas la convocation

---

## Sprint 4 — Feuille de match & Présences
> Objectif : suivi sportif opérationnel

- [ ] Schema DB : presences, performances (stats jsonb)
- [ ] Remplissage de la feuille de match (Manager)
- [ ] Marquage des présences à l'entraînement (Manager)
- [ ] Saisie des performances après match (buts, passes, note...)
- [ ] Consultation de la feuille de match côté User
- [ ] Publication de contenu par le Manager (PDF, lien, note)
- [ ] Consultation du contenu partagé côté User

### Definition of Done
- [ ] Un Manager peut marquer les présences d'un entraînement
- [ ] Un Manager peut remplir la feuille de match et saisir les stats
- [ ] Un User peut consulter la feuille de match après le match
- [ ] Les stats sont stockées en jsonb et affichées correctement

---

## Sprint 5 — Messagerie & Vitrine
> Objectif : communication descendante et visibilité du club

- [ ] Schema DB : posts, messages
- [ ] Messagerie descendante Admin → tous les licenciés
- [ ] Messagerie descendante Manager → son équipe uniquement
- [ ] Poster un résultat sur la page vitrine (Admin)
- [ ] Corriger un résultat publié (Admin)
- [ ] Page vitrine publique (résultats + actualités)
- [ ] Sondages et inscriptions événements (Users)
- [ ] Notifications lors d'un nouveau message ou sondage

### Definition of Done
- [ ] Un Admin peut envoyer un message à tous les licenciés du club
- [ ] Un Manager peut envoyer un message à son équipe uniquement
- [ ] Un Admin peut poster et corriger un résultat sur la vitrine
- [ ] Un User peut répondre à un sondage

---

## Sprint 6 — Module Financier
> Objectif : Admin pilote les finances du club

- [ ] Schema DB : cotisations, expenses, sponsors
- [ ] Tableau de bord financier global (Admin)
- [ ] Gestion des cotisations par licencié (ajout, statut payé/en attente/en retard)
- [ ] Gestion des licences et inscriptions
- [ ] Ajout / modification / suppression d'une dépense (Admin)
- [ ] Catégorisation des dépenses
- [ ] Ajout d'un sponsor avec informations de base

### Definition of Done
- [ ] Un Admin voit le tableau de bord financier consolidé (recettes, dépenses, solde)
- [ ] Une cotisation est bien liée à un userId et visible dans le suivi Admin
- [ ] L'accès au module financier est strictement réservé à l'Admin

---

## Sprint 7 — _(supprimé)_
> Anciens événements associatifs (todo lists / inscriptions) — feature retirée du MVP.

---

## Sprint 8 — Polish & Stabilisation
> Objectif : app prête pour les premiers clubs pilotes

- [ ] Onboarding (création de club + premier Admin)
- [ ] Gestion des erreurs et états vides (empty states)
- [ ] Responsive mobile (priorité absolue)
- [ ] Rate limiting sur les endpoints publics
- [ ] Tests end-to-end sur les flux critiques (auth, convocation, cotisation)
- [ ] Audit sécurité (ownership checks, clubId sur toutes les queries, RGPD)
- [ ] Performance (lazy loading, pagination des listes)

### Definition of Done
- [ ] Un nouveau club peut être créé via l'onboarding sans intervention manuelle
- [ ] Tous les écrans sont utilisables sur mobile
- [ ] Aucune query ne retourne de données d'un autre club
- [ ] Les flux critiques sont couverts par des tests e2e

---

## Hors scope MVP (V2+)
- Authentification OTP SMS (Twilio)
- Bibliothèque d'exercices et plans d'entraînement
- Features ✨ AI (génération de séance, résumé de match, chat financier)
- Boutique / merchandising
- Import automatique calendrier fédération
- Publication automatique réseaux sociaux
- Gamification (badges, streaks, Man of the Match)
- Relances automatiques de cotisations
- Page vitrine publique sans compte
- Espace événements : covoiturage
