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

// ---------------------------------------------------------------------------
// Équipes
// ---------------------------------------------------------------------------
export const createTeamSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  category: z.string().min(1, 'Catégorie requise'),
  season: z
    .string()
    .regex(/^\d{4}-\d{4}$/, 'Format attendu : 2024-2025')
    .refine((s) => {
      const [start, end] = s.split('-').map(Number)
      return end === start + 1
    }, 'La saison doit couvrir deux années consécutives (ex : 2024-2025)'),
})

export const updateTeamSchema = createTeamSchema

export type CreateTeamInput = z.infer<typeof createTeamSchema>
export type UpdateTeamInput = z.infer<typeof updateTeamSchema>

// ---------------------------------------------------------------------------
// Événements
// ---------------------------------------------------------------------------
export const eventTypeSchema = z.enum(['match', 'training', 'other'])

export const createEventSchema = z.object({
  title: z.string().min(2, 'Titre trop court'),
  type: eventTypeSchema,
  date: z.string().min(1, 'Date et heure requises'),
  location: z.string().optional(),
  teamId: z.string().optional(),
})

export const updateEventSchema = createEventSchema

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
