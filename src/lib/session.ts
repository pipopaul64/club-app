import { headers } from 'next/headers'
import { auth } from './auth'
import type { UserRole } from '@/db/schema'
import { checkRole } from './check-role'

/**
 * Résout la session courante depuis les headers HTTP.
 * À utiliser dans chaque Server Action et Server Component protégé.
 *
 * @throws {Error} 'Unauthorized' si aucune session valide
 */
export async function requireSession() {
  let session = null
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch {
    throw new Error('Unauthorized')
  }
  if (!session) throw new Error('Unauthorized')
  return session
}

/**
 * Combinaison la plus courante dans les Server Actions :
 * session valide + rôle autorisé + clubId résolu depuis la session.
 *
 * Le clubId ne transite jamais par le client.
 *
 * @throws {Error} 'Unauthorized' | 'Forbidden' | 'No club associated with this user'
 */
export async function requireAuth(requiredRoles: UserRole[]) {
  const session = await requireSession()

  // Vérification du rôle depuis la DB (source de vérité, filtre soft-delete)
  const allowed = await checkRole(session.user.id, requiredRoles)
  if (!allowed) throw new Error('Forbidden')

  // Le clubId est lu depuis la session — jamais depuis le client
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')

  const role = (session.user as { role?: string }).role as UserRole ?? 'user'

  return {
    session,
    user: session.user,
    clubId,
    role,
  }
}

/**
 * Vérifie uniquement la session, sans contrainte de rôle ni de clubId.
 * Utile pour les pages dashboard accessibles à tous les rôles.
 */
export async function requireSessionWithClub() {
  const session = await requireSession()
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  return { session, user: session.user, clubId }
}
