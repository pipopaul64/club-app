# SCHEMA — ClubOS

## Multi-tenancy
Chaque ressource a un clubId obligatoire.
Toujours filtrer par clubId dans les queries, sans exception.
Le clubId est toujours résolu depuis la session, jamais depuis le client.

---

## Tables principales

```
clubs
  id, name, slug, createdAt, deletedAt

users
  id, clubId, email, phone (nullable), role, birthDate, createdAt, deletedAt

teams
  id, clubId, name, category, season, managerId (userId)

events
  id, clubId, teamId (nullable), type (match|training|other)
  title, date, location, createdAt

convocations
  id, eventId, userId, status (pending|confirmed|declined), createdAt

presences
  id, eventId, userId, present (bool), createdAt

performances
  id, eventId, userId, stats (jsonb), createdAt

posts
  id, clubId, type (result|news), content, publishedAt, createdAt

messages
  id, clubId, teamId (nullable), authorId, content, createdAt

surveys
  id, clubId, title, createdAt
  
survey_responses
  id, surveyId, userId, answer (jsonb), createdAt

cotisations
  id, userId, clubId, amount, status (pending|paid|late), dueDate, paidAt, createdAt

expenses
  id, clubId, authorId, amount, category, receiptUrl, description, createdAt

sponsors
  id, clubId, name, amount, startDate, endDate, notes, createdAt

event_tasks
  id, eventId, assigneeId (userId), title, done (bool), createdAt

event_registrations
  id, eventId, userId, createdAt
```

---

## Règles sur les cotisations
- Une cotisation est individuelle : elle est liée à un userId
- Le suivi global (impayés, taux de recouvrement) est calculé côté Admin via agrégation sur clubId
- Un Manager Sportif ou Associatif n'a pas accès aux cotisations

---

## Index
```
users         : (clubId, role), (clubId, email)
events        : (clubId, teamId, date)
convocations  : (eventId, userId)
presences     : (eventId, userId)
cotisations   : (userId), (clubId, status)
expenses      : (clubId, createdAt)
messages      : (clubId, teamId)
```

---

## Relations & Cascades
- Supprimer un club → cascade sur toutes ses ressources
- Supprimer un événement → cascade sur convocations, presences, performances, event_tasks, event_registrations
- Supprimer une équipe → ne pas supprimer les events (conserver l'historique)
- Supprimer un user → soft delete uniquement (conserver les données historiques)

---

## Soft Delete
- **users** : deletedAt (nullable) — jamais supprimés physiquement
- **clubs** : deletedAt (nullable)
- Toutes les autres ressources : suppression physique en cascade

---

## Notes sur le champ stats (performances)
Le champ `stats` est un jsonb libre pour s'adapter à tous les sports.
Exemple football :
```json
{
  "goals": 2,
  "assists": 1,
  "rating": 7.5,
  "minutesPlayed": 90
}
```
