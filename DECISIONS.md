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

## Rôles : cumul Admin = Manager Sportif + Manager Associatif
**Décision** : le rôle Admin inclut automatiquement tous les droits Manager Sportif et Manager Associatif.
**Raison** : dans les petits clubs, le président ou l'employé fait tout. Évite de cumuler manuellement les rôles.
**Impact** : la vérification de rôle doit inclure 'admin' dans tous les checks manager :
```typescript
checkRole(session.user.id, ['admin', 'manager_sportif'])
checkRole(session.user.id, ['admin', 'manager_associatif'])
```

---

## Soft delete : users et clubs uniquement
**Décision** : soft delete (deletedAt) uniquement sur users et clubs. Suppression physique en cascade pour le reste.
**Raison** : conserver l'historique des données utilisateur (RGPD, litiges). Les autres ressources n'ont pas cet enjeu.
**Impact** : toujours filtrer `where(isNull(users.deletedAt))` dans les queries sur users.
