import type { UserRole } from '@/db/schema'

/**
 * Modèle de rôles ADDITIF (cf. DECISIONS.md)
 * - 'user' est implicite : toujours présent dans `users.roles`
 * - 'manager' et 'admin' sont AJOUTÉS explicitement
 * - Aucune hiérarchie : un admin n'a PAS automatiquement les droits manager.
 *   Pour avoir les deux, il faut être explicitement [user, manager, admin].
 */

/**
 * Vrai si l'utilisateur possède au moins un des rôles requis.
 */
export function hasRole(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
  return requiredRoles.some((r) => userRoles.includes(r))
}

/**
 * Garantit que 'user' est toujours présent et déduplique.
 * À utiliser dès qu'on construit/modifie un tableau de rôles.
 */
export function normalizeRoles(roles: UserRole[]): UserRole[] {
  const set = new Set<UserRole>(roles)
  set.add('user')
  return Array.from(set)
}
