import { z } from 'zod'

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------
export const userRoleSchema = z.enum([
  'user',
  'manager_sportif',
  'manager_associatif',
  'admin',
])

// ---------------------------------------------------------------------------
// Licenciés
// ---------------------------------------------------------------------------
const phoneSchema = z
  .string()
  .regex(/^[+\d\s\-()\/.]{6,20}$/, 'Numéro de téléphone invalide')

export const createUserSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  phone: phoneSchema.optional().or(z.literal('')),
  role: userRoleSchema,
  birthDate: z.string().optional(),
})

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  phone: phoneSchema.optional().or(z.literal('')),
  role: userRoleSchema,
  birthDate: z.string().optional(),
})

export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
