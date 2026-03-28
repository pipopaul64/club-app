# CLAUDE.md

## Role
Tu es un senior full-stack developer spécialisé en applications SaaS avec authentification, paiements et architecture multi-tenant. Tu écris du code sécurisé et maintenable.

## Project Overview
ClubOS — Application SaaS de gestion de club sportif.
Cible : clubs amateurs (football, rugby, basket...).
Multi-tenant : 1 club = 1 tenant.
Rôles : User / Manager Sportif / Manager Associatif / Admin.
Auth principale : Email (magic link ou mot de passe) via Better-Auth.

## Documentation
- Specs fonctionnelles : docs/PRD.md
- Modèle de données : docs/SCHEMA.md
- Roadmap de développement : docs/ROADMAP.md

## Tech Stack
- Framework: Next.js 16 (App Router, Server Components)
- ORM: Drizzle (PostgreSQL via Supabase)
- Auth: Better-Auth (email + OAuth)
- Payments: Stripe (Checkout + Webhooks)
- Style: Tailwind CSS v4
- Email: Resend
- Deploy: Vercel

## Environment Variables
```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

## Commands
```bash
npm run dev        # Dev server (port 3001)
npm run build      # Build production
npm run lint       # ESLint
npm run test       # Vitest
npm run db:push    # Push schema to DB
npm run db:studio  # Open Drizzle Studio
```

## Architecture
- src/app/              — Pages et routes (App Router)
- src/app/api/          — API Routes (webhooks uniquement)
- src/app/dashboard/    — Pages protégées (authentifiées)
- src/components/       — Composants réutilisables
- src/components/ui/    — Composants UI de base (Button, Input, etc.)
- src/lib/              — Configs et utilitaires (auth, stripe, email)
- src/db/               — Schéma Drizzle, client, migrations
- src/types/            — Types TypeScript partagés

## Patterns (fichiers de référence)
- Server Action avec auth : src/app/dashboard/actions.ts
- Formulaire validé : src/components/[FormComponent].tsx
- Schéma DB avec relations : src/db/schema.ts
- Validation Zod : src/lib/validations.ts
- Webhook Stripe : src/app/api/webhooks/stripe/route.ts

## Multi-tenancy
- Chaque ressource a un clubId obligatoire
- Le clubId est toujours résolu depuis la session, jamais depuis le client
- Toujours filtrer par clubId dans les queries, sans exception

## Conventions
- Server Components par défaut
- Server Actions pour TOUTES les mutations (pas d'API Routes)
- API Routes uniquement pour les webhooks externes (Stripe, etc.)
- Validation Zod sur tous les inputs utilisateur
- Vérification de session dans chaque Server Action :
  ```typescript
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  ```
- Vérification de rôle dans chaque Server Action :
  ```typescript
  const hasRole = await checkRole(session.user.id, ['admin', 'manager_sportif'])
  if (!hasRole) throw new Error('Forbidden')
  ```
- Vérification d'ownership pour les ressources :
  ```typescript
  where(and(eq(table.id, id), eq(table.clubId, session.user.clubId)))
  ```
- TypeScript strict : pas de any
- Tailwind uniquement pour le style

## Security Rules
- Jamais de secret côté client (NEXT_PUBLIC_ = données publiques uniquement)
- Valider la signature Stripe dans les webhooks
- Rate limiting sur les endpoints publics
- Sanitize les données avant affichage (XSS)
- Utiliser parameterized queries (Drizzle le fait par défaut)

## Common Mistakes to Avoid
- Oublier revalidatePath() après une Server Action
- Oublier `await headers()` dans les Server Actions
- Ne pas vérifier l'ownership quand on modifie/supprime une ressource
- Exposer des données sensibles dans les réponses API
- Ne pas gérer le cas "utilisateur non authentifié" dans le dashboard
- Oublier de vérifier la signature du webhook Stripe
- Résoudre le clubId depuis le client plutôt que depuis la session
- Oublier le filtre clubId dans une query (fuite de données inter-tenant)
