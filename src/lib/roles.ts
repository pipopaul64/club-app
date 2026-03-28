import type { UserRole } from '@/db/schema'

/**
 * Hiérarchie des rôles — Admin cumule tous les droits (cf. DECISIONS.md)
 */
const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'manager_sportif', 'manager_associatif', 'user'],
  manager_sportif: ['manager_sportif', 'user'],
  manager_associatif: ['manager_associatif', 'user'],
  user: ['user'],
}

/**
 * Vérifie si un rôle donné satisfait au moins un des rôles requis.
 * Admin satisfait toujours n'importe quel rôle requis.
 */
export function hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
  const grantedRoles = ROLE_HIERARCHY[userRole] ?? []
  return requiredRoles.some((r) => grantedRoles.includes(r))
}
