'use server'

import { db } from '@/db'
import { teamManagers, teamMembers, teams, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { completeOnboardingSchema } from '@/lib/validations'
import { and, eq, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

// ---------------------------------------------------------------------------
// Contexte d'onboarding (lecture)
// ---------------------------------------------------------------------------
export type OnboardingContext = {
  userId:               string
  email:                string
  name:                 string | null
  roles:                UserRole[]
  isManager:            boolean
  alreadyCompleted:     boolean
  availableTeams:       { id: string; name: string; category: string; season: string }[]
  // Si l'utilisateur retourne sur l'onboarding après l'avoir complété
  currentMemberTeamIds:  string[]
  currentManagerTeamIds: string[]
}

export async function getOnboardingContext(): Promise<OnboardingContext> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, email: true, name: true, roles: true, onboardingCompletedAt: true },
  })
  if (!user) throw new Error('User not found')

  const roles = (user.roles ?? ['user']) as UserRole[]
  const isManager = roles.includes('manager')

  const [availableTeams, currentMemberships, currentManagedTeams] = await Promise.all([
    db.query.teams.findMany({
      where: eq(teams.clubId, clubId),
      columns: { id: true, name: true, category: true, season: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    }),
    db.query.teamMembers.findMany({
      where: and(eq(teamMembers.userId, user.id), eq(teamMembers.clubId, clubId)),
      columns: { teamId: true },
    }),
    db.query.teamManagers.findMany({
      where: and(eq(teamManagers.userId, user.id), eq(teamManagers.clubId, clubId)),
      columns: { teamId: true },
    }),
  ])

  return {
    userId:                user.id,
    email:                 user.email,
    name:                  user.name,
    roles,
    isManager,
    alreadyCompleted:      user.onboardingCompletedAt !== null,
    availableTeams,
    currentMemberTeamIds:  currentMemberships.map((m) => m.teamId),
    currentManagerTeamIds: currentManagedTeams.map((m) => m.teamId),
  }
}

// ---------------------------------------------------------------------------
// completeOnboarding — sauvegarde profil + équipes, marque onboarding terminé
// ---------------------------------------------------------------------------
export async function completeOnboarding(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { success: false, error: 'Session expirée' }

  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) return { success: false, error: 'Aucun club associé' }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, roles: true, name: true },
  })
  if (!user) return { success: false, error: 'Utilisateur introuvable' }

  const parsed = completeOnboardingSchema.safeParse({
    phone:          formData.get('phone') || undefined,
    birthDate:      formData.get('birthDate') || undefined,
    teamMemberIds:  formData.getAll('teamMemberIds'),
    teamManagerIds: formData.getAll('teamManagerIds'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { phone, birthDate, teamMemberIds, teamManagerIds } = parsed.data

  const roles = (user.roles ?? ['user']) as UserRole[]
  const isManager = roles.includes('manager')

  // Validation conditionnelle :
  //  - User simple → ≥1 équipe où il joue
  //  - Manager     → ≥1 équipe à gérer (joueur optionnel)
  if (!isManager && teamMemberIds.length === 0) {
    return { success: false, error: 'Sélectionnez au moins une équipe' }
  }
  if (isManager && teamManagerIds.length === 0) {
    return { success: false, error: 'Sélectionnez au moins une équipe à gérer' }
  }

  // Vérifier que tous les teamIds appartiennent bien au club
  const allTeamIds = Array.from(new Set([...teamMemberIds, ...teamManagerIds]))
  if (allTeamIds.length > 0) {
    const validTeams = await db.query.teams.findMany({
      where: and(eq(teams.clubId, clubId), inArray(teams.id, allTeamIds)),
      columns: { id: true },
    })
    const validIds = new Set(validTeams.map((t) => t.id))
    const invalid = allTeamIds.filter((id) => !validIds.has(id))
    if (invalid.length > 0) {
      return { success: false, error: 'Une ou plusieurs équipes sélectionnées sont introuvables' }
    }
  }

  // Mise à jour profil
  await db.update(users)
    .set({
      phone:                 phone || null,
      birthDate:             birthDate ? new Date(birthDate) : null,
      onboardingCompletedAt: new Date(),
      updatedAt:             new Date(),
    })
    .where(eq(users.id, user.id))

  // Réécriture des équipes : remplace l'existant (idempotent côté UI)
  await db.delete(teamMembers).where(
    and(eq(teamMembers.userId, user.id), eq(teamMembers.clubId, clubId)),
  )
  if (teamMemberIds.length > 0) {
    await db.insert(teamMembers).values(
      teamMemberIds.map((teamId) => ({
        id: crypto.randomUUID(),
        teamId,
        userId: user.id,
        clubId,
      })),
    )
  }

  await db.delete(teamManagers).where(
    and(eq(teamManagers.userId, user.id), eq(teamManagers.clubId, clubId)),
  )
  if (teamManagerIds.length > 0) {
    await db.insert(teamManagers).values(
      teamManagerIds.map((teamId) => ({
        id: crypto.randomUUID(),
        teamId,
        userId: user.id,
        clubId,
      })),
    )
  }

  revalidatePath('/dashboard')
  return { success: true, data: undefined }
}
