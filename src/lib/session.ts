import { headers } from 'next/headers'
import { auth } from './auth'
import type { UserRole } from '@/db/schema'
import { hasRole } from './roles'

/**
 * Résout la session courante depuis les headers HTTP.
 * À utiliser dans chaque Server Action et Server Component protégé.
 *
 * @throws {Error} 'Unauthorized' si aucune session valide
 */
export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

/**
 * Résout la session ET vérifie le rôle.
 * Le clubId est lu depuis la session (jamais depuis le client).
 *
 * @throws {Error} 'Unauthorized' | 'Forbidden'
 */
export async function requireRole(requiredRoles: UserRole[]) {
  const session = await requireSession()
  const userRole = (session.user as { role?: UserRole }).role ?? 'user'

  if (!hasRole(userRole, requiredRoles)) {
    throw new Error('Forbidden')
  }

  return session
}

/**
 * Résout le clubId depuis la session — jamais depuis le client.
 *
 * @throws {Error} 'Unauthorized' | 'No club associated'
 */
export async function requireClubId(): Promise<string> {
  const session = await requireSession()
  const clubId = (session.user as { clubId?: string }).clubId

  if (!clubId) throw new Error('No club associated with this user')

  return clubId
}

/**
 * Combinaison la plus courante : session + rôle + clubId.
 */
export async function requireAuth(requiredRoles: UserRole[]) {
  const session = await requireRole(requiredRoles)
  const clubId = (session.user as { clubId?: string }).clubId

  if (!clubId) throw new Error('No club associated with this user')

  return {
    session,
    user: session.user,
    clubId,
    role: (session.user as { role?: UserRole }).role ?? 'user',
  }
}
