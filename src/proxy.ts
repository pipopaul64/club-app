import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

/**
 * ARCHITECTURE — deux niveaux de protection :
 *
 * 1. proxy.ts (ici) — Edge, sans accès DB
 *    → Vérifie uniquement la PRÉSENCE du cookie de session
 *    → Route non authentifiée → redirect /login
 *    → Route non autorisée (rôle) → 403 pour les API, redirect /dashboard pour les pages
 *    ⚠️  Le rôle NE PEUT PAS être vérifié ici sans appel DB (Edge runtime)
 *
 * 2. Server Actions — Node.js, avec accès DB
 *    → requireAuth(roles) → checkRole(userId, roles) → DB query fraîche
 *    → C'est ici que la sécurité est réellement appliquée
 */

type RouteRule = {
  pattern: RegExp
  requireAuth?: true   // authentification requise
  public?: true        // route publique
}

const ROUTE_RULES: RouteRule[] = [
  // Routes publiques
  { pattern: /^\/$/, public: true },
  { pattern: /^\/login(\/.*)?$/, public: true },
  { pattern: /^\/register(\/.*)?$/, public: true },
  { pattern: /^\/api\/auth\//, public: true },
  { pattern: /^\/api\/webhooks\//, public: true },
  // Routes protégées — authentification requise (rôle vérifié dans les Server Actions)
  { pattern: /^\/dashboard/, requireAuth: true },
  { pattern: /^\/api\//, requireAuth: true },
]

function matchRule(pathname: string): RouteRule | null {
  return ROUTE_RULES.find((r) => r.pattern.test(pathname)) ?? null
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rule = matchRule(pathname)

  // Route publique ou non listée → laisser passer
  if (!rule || rule.public) {
    return NextResponse.next()
  }

  if (rule.requireAuth) {
    const sessionCookie = getSessionCookie(request)

    if (!sessionCookie) {
      // Requête API non authentifiée → 401
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      // Page non authentifiée → redirect /login avec paramètre de retour
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
