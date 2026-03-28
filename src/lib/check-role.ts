import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, isNull, and } from 'drizzle-orm'
import type { UserRole } from '@/db/schema'
import { hasRole } from './roles'

/**
 * Vérifie le rôle d'un utilisateur directement en base de données.
 * Source de vérité — à utiliser dans toutes les Server Actions.
 *
 * Conforme CLAUDE.md :
 *   const ok = await checkRole(session.user.id, ['admin', 'manager_sportif'])
 *   if (!ok) throw new Error('Forbidden')
 *
 * - Filtre les soft-deleted (deletedAt IS NULL)
 * - Admin cumule tous les droits (cf. DECISIONS.md)
 * - Retourne false si l'utilisateur n'existe pas (pas de throw)
 */
export async function checkRole(
  userId: string,
  requiredRoles: UserRole[],
): Promise<boolean> {
  const user = await db.query.users.findFirst({
    where: and(eq(users.id, userId), isNull(users.deletedAt)),
    columns: { role: true },
  })

  if (!user) return false

  return hasRole(user.role as UserRole, requiredRoles)
}
