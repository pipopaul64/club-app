import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'
import type { UserRole } from '@/db/schema'
import { hasRole } from '@/lib/roles'

// ---------------------------------------------------------------------------
// Route definitions — ordre important, la première règle qui match s'applique
// ---------------------------------------------------------------------------
type RouteRule = {
  pattern: RegExp
  roles?: UserRole[]   // si absent → toute personne authentifiée
  public?: true         // route publique, pas d'auth requise
}

const ROUTE_RULES: RouteRule[] = [
  // Routes publiques
  { pattern: /^\/$/, public: true },
  { pattern: /^\/login/, public: true },
  { pattern: /^\/register/, public: true },
  { pattern: /^\/api\/auth\//, public: true },
  { pattern: /^\/api\/webhooks\//, public: true },
  { pattern: /^\/_next\//, public: true },
  { pattern: /^\/favicon\.ico$/, public: true },
  // Routes Admin uniquement
  { pattern: /^\/dashboard\/admin\//, roles: ['admin'] },
  // Routes Manager Associatif +
  { pattern: /^\/dashboard\/associatif\//, roles: ['manager_associatif'] },
  // Routes Manager Sportif +
  { pattern: /^\/dashboard\/sport\//, roles: ['manager_sportif'] },
  // Dashboard général — toute personne authentifiée
  { pattern: /^\/dashboard\//, roles: ['user'] },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function matchRule(pathname: string): RouteRule | null {
  return ROUTE_RULES.find((r) => r.pattern.test(pathname)) ?? null
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const rule = matchRule(pathname)

  // Route publique ou non gérée → laisser passer
  if (!rule || rule.public) {
    return NextResponse.next()
  }

  // Vérifier la session via le cookie Better-Auth
  const sessionCookie = getSessionCookie(request)

  if (!sessionCookie) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Vérification du rôle côté middleware (lecture du cookie de session enrichi)
  // Le rôle complet est validé dans chaque Server Action — ici c'est une
  // première ligne de défense pour la navigation.
  if (rule.roles) {
    const userRole = (sessionCookie as unknown as { role?: UserRole }).role ?? 'user'
    if (!hasRole(userRole, rule.roles)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Correspond à toutes les routes sauf les fichiers statiques Next.js internes.
     * On exclut aussi les images et autres assets.
     */
    '/((?!_next/static|_next/image|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
