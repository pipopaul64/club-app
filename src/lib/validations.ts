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

// ---------------------------------------------------------------------------
// Convocations
// ---------------------------------------------------------------------------
export const createConvocationSchema = z.object({
  eventId: z.string().min(1, 'Événement requis'),
  userIds: z
    .array(z.string())
    .min(1, 'Sélectionner au moins un joueur'),
})

export type CreateConvocationInput = z.infer<typeof createConvocationSchema>

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export const createMessageSchema = z.object({
  content: z.string().min(1, 'Le message ne peut pas être vide').max(2000, 'Message trop long (2000 caractères max)'),
  teamId: z.string().optional(),
})

export type CreateMessageInput = z.infer<typeof createMessageSchema>

// ---------------------------------------------------------------------------
// Posts (vitrine)
// ---------------------------------------------------------------------------
export const postTypeSchema = z.enum(['result', 'news'])

export const createPostSchema = z.object({
  type:    postTypeSchema,
  content: z.string().min(1, 'Le contenu ne peut pas être vide').max(5000, 'Contenu trop long (5000 caractères max)'),
})

export const updatePostSchema = createPostSchema

export type CreatePostInput = z.infer<typeof createPostSchema>
export type UpdatePostInput = z.infer<typeof updatePostSchema>

// ---------------------------------------------------------------------------
// Surveys
// ---------------------------------------------------------------------------
export const createSurveySchema = z.object({
  title: z.string().min(2, 'La question doit faire au moins 2 caractères').max(500, 'Question trop longue'),
})

export type CreateSurveyInput = z.infer<typeof createSurveySchema>
