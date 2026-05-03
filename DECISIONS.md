# DECISIONS — ClubOS

Ce fichier documente les choix architecturaux et leurs raisons.
Ne pas modifier ces choix sans mettre à jour ce fichier.

---

## Auth : email en V1, OTP SMS en V2
**Décision** : Better-Auth avec email (magic link ou mot de passe) au lancement.
**Raison** : simplicité de mise en place, Better-Auth le supporte nativement sans service tiers.
**OTP SMS reporté** : coût Twilio (~0.05€/SMS) + complexité anti-fraude (SMS pumping) non justifiés au MVP.
**Impact** : le champ `phone` est nullable dans la table users.

---

## WhatsApp : deep link, pas d'API
**Décision** : génération d'un message formaté + lien wa.me — pas d'intégration API WhatsApp.
**Raison** : l'API WhatsApp Business est payante et complexe. Les clubs utilisent déjà WhatsApp naturellement.
**Principe** : l'app reste la source de vérité. WhatsApp est uniquement un canal de diffusion.
**Impact** : pas de dépendance à Meta, pas de coût supplémentaire.

---

## Multi-tenant : clubId sur chaque ressource
**Décision** : toutes les tables ont un clubId. Pas de schema PostgreSQL par tenant.
**Raison** : plus simple à développer et maintenir à ce stade. Suffisant jusqu'à ~500 clubs.
**Règle absolue** : le clubId est toujours résolu depuis la session, jamais depuis le client.
**À réévaluer** : si on dépasse 500 clubs actifs ou si des problèmes de performance apparaissent.

---

## Pas de messagerie temps réel au MVP
**Décision** : pas de WebSocket, pas de Supabase Realtime au MVP.
**Raison** : complexité non justifiée. La messagerie descendante (admin → licenciés) n'est pas du chat.
**WhatsApp gère l'informel** : les échanges entre coéquipiers restent sur WhatsApp.
**À réévaluer** : si les clubs expriment un besoin fort de chat interne en V2.

---

## Pas de gestion de compte mineur
**Décision** : pas de logique parent/enfant dans l'app au MVP.
**Raison** : complexité technique et UX non justifiée au lancement. Un parent utilise simplement le compte de son enfant.
**Impact** : pas de champ `isMinor`, pas de `parentName`, pas de lien entre comptes.
**À réévaluer** : si la conformité RGPD l'exige explicitement.

---

## Performances : champ stats en jsonb
**Décision** : les statistiques de match sont stockées dans un champ jsonb libre.
**Raison** : l'app cible plusieurs sports (football, rugby, basket...). Un schema fixe serait trop rigide.
**Impact** : pas de validation de schema côté DB, validation côté app (Zod) selon le sport du club.
**Exemple** : `{ "goals": 2, "assists": 1, "rating": 7.5, "minutesPlayed": 90 }`

---

## Cotisations : gestion manuelle au MVP
**Décision** : les cotisations sont saisies et mises à jour manuellement par l'Admin. Pas de paiement en ligne au MVP.
**Raison** : intégration Stripe pour les paiements = complexité (webhooks, remboursements, conformité) non justifiée au lancement.
**Impact** : Stripe est dans la stack mais non utilisé pour les cotisations au MVP.
**À réévaluer** : dès que le besoin de paiement en ligne est confirmé par les clubs pilotes.

---

## Rôles : modèle additif strict (pas de cumul automatique)
**Décision** : `users.roles` est un tableau `text[]` de rôles **explicitement** assignés, sans hiérarchie automatique.
- Valeurs : `'user' | 'manager' | 'admin'`
- `'user'` est implicite (toujours présent, jamais retiré)
- `'manager'` et `'admin'` sont **additifs** : un Admin n'hérite PAS des droits Manager
- Pour avoir les deux capacités, l'utilisateur doit recevoir `['user', 'manager', 'admin']`

**Raison** : les responsabilités d'un manager d'équipe (convocations, feuille de match, scope par équipe) sont fonctionnellement très différentes de celles d'un admin (finances, licenciés, vitrine). Le cumul implicite obligeait à pousser un admin par défaut dans des écrans qui ne le concernaient pas, et masquait la distinction réelle. L'ajout explicite est plus simple à raisonner et oblige à choisir.

**Implication code** :
```typescript
// checkRole accepte plusieurs rôles ; renvoie true si l'user en possède AU MOINS UN
const ok = await checkRole(session.user.id, ['admin', 'manager'])

// Pour les checks de scope par équipe, vérifier admin EN PREMIER pour bypass scoping :
if (roles.includes('admin')) { /* voit tout */ }
else if (roles.includes('manager')) { /* uniquement ses équipes gérées */ }
```

**Évolution depuis le MVP initial** : précédemment Admin auto-cumulait Manager Sportif + Manager Associatif. Le rôle "Manager Associatif" a été supprimé entièrement (cf. ci-dessous), et le cumul implicite a été retiré pour clarifier les responsabilités.

---

## Suppression du rôle Manager Associatif
**Décision** : le rôle `manager_associatif` (renommé `asso` lors d'une étape intermédiaire, puis supprimé) n'existe plus. Les capacités associatives (dépenses, événements avec todo lists, inscriptions) sont :
- **Dépenses** : remontées au rôle Admin (seul à gérer les finances)
- **Événements associatifs / todo lists / inscriptions** : retirés du MVP (`event_tasks` et `event_registrations` supprimés du schéma)

**Raison** : trop de friction architecturale et UI (un rôle entier + 2 tables + plusieurs pages) pour une seule feature qui restait peu utilisée (saisie de dépenses). Les bénévoles peuvent continuer à transmettre leurs justificatifs hors-app au bureau, qui les saisit comme Admin.

**À réévaluer** : si plusieurs clubs pilotes expriment le besoin d'un workflow dépenses bénévole, ré-introduire un rôle minimal ou un partage temporaire d'accès limité.

---

## Soft delete : users et clubs uniquement
**Décision** : soft delete (deletedAt) uniquement sur users et clubs. Suppression physique en cascade pour le reste.
**Raison** : conserver l'historique des données utilisateur (RGPD, litiges). Les autres ressources n'ont pas cet enjeu.
**Impact** : toujours filtrer `where(isNull(users.deletedAt))` dans les queries sur users.
