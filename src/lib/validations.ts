import { z } from 'zod'

// ---------------------------------------------------------------------------
// Rôles
// ---------------------------------------------------------------------------
export const userRoleSchema = z.enum(['user', 'manager', 'admin'])

/**
 * Rôles assignables explicitement via l'UI.
 * 'user' est implicite et toujours présent — pas un choix.
 */
export const assignableRoleSchema = z.enum(['manager', 'admin'])
export const userRolesSchema = z.array(assignableRoleSchema)

// ---------------------------------------------------------------------------
// Licenciés
// ---------------------------------------------------------------------------
const phoneSchema = z
  .string()
  .regex(/^[+\d\s\-()\/.]{6,20}$/, 'Numéro de téléphone invalide')

// Pas de createUserSchema : la création passe désormais par invitation +
// auto-redemption (cf. invitations + onboarding). Seul updateUserSchema reste
// — l'admin édite les rôles/infos d'un licencié existant.
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  email: z.string().email('Email invalide'),
  phone: phoneSchema.optional().or(z.literal('')),
  roles: userRolesSchema,
  birthDate: z.string().optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------
/**
 * Rôle proposé à l'invitation.
 * 'user' = simple licencié ; 'manager' = également manager d'équipe(s).
 * 'admin' n'est jamais invité — il faut promouvoir un licencié existant.
 */
export const invitedRoleSchema = z.enum(['user', 'manager'])

export const createInvitationSchema = z.object({
  email: z.string().email('Email invalide'),
  invitedRole: invitedRoleSchema,
})
export type CreateInvitationInput = z.infer<typeof createInvitationSchema>

/**
 * Acceptation d'une invitation : nom + mot de passe.
 * Le name est requis ici car Better-Auth signUpEmail l'exige.
 */
export const redeemInviteSchema = z.object({
  name: z.string().min(2, 'Nom trop court'),
  password: z.string().min(8, 'Mot de passe : 8 caractères minimum'),
})
export type RedeemInviteInput = z.infer<typeof redeemInviteSchema>

/**
 * Onboarding (post-redemption) : profil + équipes.
 *  - teamMemberIds  = équipes où je joue (≥1 pour user simple, optionnel pour manager)
 *  - teamManagerIds = équipes que je gère (≥1 pour manager, vide pour user simple)
 * La validation conditionnelle min(1) selon le rôle est faite côté Server Action
 * (le rôle vient de la session, pas du form).
 */
export const completeOnboardingSchema = z.object({
  phone: phoneSchema.optional().or(z.literal('')),
  birthDate: z.string().optional(),
  teamMemberIds: z.array(z.string()).default([]),
  teamManagerIds: z.array(z.string()).default([]),
})
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>

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

// ---------------------------------------------------------------------------
// Finance — Cotisations
// ---------------------------------------------------------------------------
export const cotisationStatusSchema = z.enum(['pending', 'paid', 'late'])

export const createCotisationSchema = z.object({
  userId:  z.string().min(1, 'Licencié requis'),
  amount:  z.coerce.number().positive('Montant requis').max(99999, 'Montant trop élevé'),
  dueDate: z.string().min(1, "Date d'échéance requise"),
})

export type CreateCotisationInput = z.infer<typeof createCotisationSchema>

// ---------------------------------------------------------------------------
// Finance — Dépenses
// ---------------------------------------------------------------------------
export const expenseCategorySchema = z.enum([
  'equipement',
  'deplacement',
  'arbitrage',
  'licence',
  'communication',
  'autre',
])

export const createExpenseSchema = z.object({
  amount:      z.coerce.number().positive('Montant requis').max(999999, 'Montant trop élevé'),
  category:    expenseCategorySchema,
  description: z.string().max(500, 'Description trop longue').optional(),
  receiptUrl:  z.string().url('URL invalide').optional().or(z.literal('')),
})

export const updateExpenseSchema = createExpenseSchema

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>

// ---------------------------------------------------------------------------
// Finance — Sponsors
// ---------------------------------------------------------------------------
export const createSponsorSchema = z.object({
  name:      z.string().min(2, 'Nom trop court'),
  amount:    z.coerce.number().positive('Montant requis').max(9999999, 'Montant trop élevé'),
  startDate: z.string().min(1, 'Date de début requise'),
  endDate:   z.string().optional(),
  notes:     z.string().max(1000, 'Notes trop longues').optional(),
})

export const updateSponsorSchema = createSponsorSchema

export type CreateSponsorInput = z.infer<typeof createSponsorSchema>
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>

