import type { UserRole } from '@/db/schema'

export type { UserRole }

/**
 * Données utilisateur enrichies dans la session.
 * Better-Auth étend le type User avec les champs additionnels.
 */
export type SessionUser = {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
  clubId: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

/**
 * Contexte d'auth résolu dans les Server Actions.
 */
export type AuthContext = {
  user: SessionUser
  clubId: string
  role: UserRole
}

/**
 * Résultat standard des Server Actions.
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
