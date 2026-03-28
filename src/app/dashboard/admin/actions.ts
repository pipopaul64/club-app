'use server'

import { db } from '@/db'
import { users, teams, teamMembers } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { hasRole } from '@/lib/roles'
import { createUserSchema, updateUserSchema, createTeamSchema, updateTeamSchema } from '@/lib/validations'
import { eq, and, isNull, inArray, notInArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

const REVALIDATE = '/dashboard/admin/users'
const REVALIDATE_TEAMS = '/dashboard/admin/teams'

// ---------------------------------------------------------------------------
// Contexte admin — session + rôle + clubId
// Factorisé pour éviter la répétition dans chaque action
// ---------------------------------------------------------------------------
async function getAdminContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const ok = await checkRole(session.user.id, ['admin'])
  if (!ok) throw new Error('Forbidden')

  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')

  return { session, clubId }
}

// ---------------------------------------------------------------------------
// listUsers — lecture seule, filtre clubId + soft delete
// ---------------------------------------------------------------------------
export async function listUsers() {
  const { clubId } = await getAdminContext()

  return db.query.users.findMany({
    where: and(eq(users.clubId, clubId), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      birthDate: true,
      createdAt: true,
    },
    orderBy: (u, { asc }) => [asc(u.name)],
  })
}

// ---------------------------------------------------------------------------
// getUser — pour le formulaire d'édition
// ---------------------------------------------------------------------------
export async function getUser(id: string) {
  const { clubId } = await getAdminContext()

  return db.query.users.findFirst({
    where: and(eq(users.id, id), eq(users.clubId, clubId), isNull(users.deletedAt)),
    columns: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      birthDate: true,
    },
  })
}

// ---------------------------------------------------------------------------
// createUser — crée un licencié dans le club de la session
// ---------------------------------------------------------------------------
export async function createUser(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const parsed = createUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    birthDate: formData.get('birthDate') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, email, phone, role, birthDate } = parsed.data

  // Unicité email dans le club
  const existing = await db.query.users.findFirst({
    where: and(
      eq(users.email, email),
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
    ),
    columns: { id: true },
  })
  if (existing) {
    return { success: false, error: 'Un licencié avec cet email existe déjà dans ce club' }
  }

  await db.insert(users).values({
    id: crypto.randomUUID(),
    clubId, // toujours depuis la session, jamais depuis le client
    name,
    email,
    phone: phone || null,
    role,
    birthDate: birthDate ? new Date(birthDate) : null,
    emailVerified: false,
  })

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// updateUser — modifie un licencié du club de la session
// ---------------------------------------------------------------------------
export async function updateUser(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const parsed = updateUserSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    birthDate: formData.get('birthDate') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, email, phone, role, birthDate } = parsed.data

  // Ownership check : clubId depuis la session, jamais depuis le client
  await db
    .update(users)
    .set({
      name,
      email,
      phone: phone || null,
      role,
      birthDate: birthDate ? new Date(birthDate) : null,
      updatedAt: new Date(),
    })
    .where(and(eq(users.id, id), eq(users.clubId, clubId), isNull(users.deletedAt)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deactivateUser — soft delete (deletedAt = now())
// ---------------------------------------------------------------------------
export async function deactivateUser(id: string): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  // Ownership check : on ne peut désactiver que des users du même club
  await db
    .update(users)
    .set({ deletedAt: new Date() })
    .where(and(eq(users.id, id), eq(users.clubId, clubId), isNull(users.deletedAt)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ===========================================================================
// ÉQUIPES
// ===========================================================================

// ---------------------------------------------------------------------------
// listTeams — liste les équipes du club avec manager et nb de membres
// ---------------------------------------------------------------------------
export async function listTeams() {
  const { clubId } = await getAdminContext()

  return db.query.teams.findMany({
    where: eq(teams.clubId, clubId),
    with: {
      manager: { columns: { id: true, name: true } },
      members: { columns: { id: true } },
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  })
}

// ---------------------------------------------------------------------------
// getTeam — détail d'une équipe avec manager et membres
// ---------------------------------------------------------------------------
export async function getTeam(id: string) {
  const { clubId } = await getAdminContext()

  return db.query.teams.findFirst({
    where: and(eq(teams.id, id), eq(teams.clubId, clubId)),
    with: {
      manager: { columns: { id: true, name: true, role: true } },
      members: {
        with: {
          user: { columns: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  })
}

// ---------------------------------------------------------------------------
// createTeam — crée une équipe dans le club de la session
// ---------------------------------------------------------------------------
export async function createTeam(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const parsed = createTeamSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    season: formData.get('season'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, category, season } = parsed.data

  await db.insert(teams).values({
    id: crypto.randomUUID(),
    clubId,
    name,
    category,
    season,
  })

  revalidatePath(REVALIDATE_TEAMS)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// updateTeam — modifie les infos d'une équipe du club
// ---------------------------------------------------------------------------
export async function updateTeam(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const parsed = updateTeamSchema.safeParse({
    name: formData.get('name'),
    category: formData.get('category'),
    season: formData.get('season'),
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { name, category, season } = parsed.data

  await db
    .update(teams)
    .set({ name, category, season })
    .where(and(eq(teams.id, id), eq(teams.clubId, clubId)))

  revalidatePath(REVALIDATE_TEAMS)
  revalidatePath(`${REVALIDATE_TEAMS}/${id}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteTeam — suppression physique (cascade sur les membres/events)
// ---------------------------------------------------------------------------
export async function deleteTeam(id: string): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  await db
    .delete(teams)
    .where(and(eq(teams.id, id), eq(teams.clubId, clubId)))

  revalidatePath(REVALIDATE_TEAMS)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// assignManagerToTeam — assigne (ou retire) un Manager Sportif à une équipe
// managerId vide = retirer le manager
// ---------------------------------------------------------------------------
export async function assignManagerToTeam(
  teamId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const managerId = (formData.get('managerId') as string) || null

  // Vérifier que l'équipe appartient bien au club
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
    columns: { id: true },
  })
  if (!team) return { success: false, error: 'Équipe introuvable' }

  if (managerId) {
    // Vérifier que le manager appartient au club et a le bon rôle
    const manager = await db.query.users.findFirst({
      where: and(
        eq(users.id, managerId),
        eq(users.clubId, clubId),
        isNull(users.deletedAt),
      ),
      columns: { id: true, role: true },
    })
    if (!manager) return { success: false, error: 'Licencié introuvable' }
    if (!hasRole(manager.role as UserRole, ['manager_sportif', 'admin'])) {
      return { success: false, error: 'Ce licencié n\'est pas Manager Sportif' }
    }
  }

  await db
    .update(teams)
    .set({ managerId })
    .where(and(eq(teams.id, teamId), eq(teams.clubId, clubId)))

  revalidatePath(`${REVALIDATE_TEAMS}/${teamId}`)
  revalidatePath(REVALIDATE_TEAMS)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// assignPlayerToTeam — ajoute un joueur à une équipe
// Contrainte : un joueur ne peut être dans qu'une seule équipe par saison
// ---------------------------------------------------------------------------
export async function assignPlayerToTeam(
  teamId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  const userId = (formData.get('userId') as string | null) ?? ''
  if (!userId) return { success: false, error: 'Veuillez sélectionner un licencié' }

  // Vérifier que l'équipe appartient au club
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
    columns: { id: true, season: true },
  })
  if (!team) return { success: false, error: 'Équipe introuvable' }

  // Vérifier que le licencié appartient au club et est actif
  const user = await db.query.users.findFirst({
    where: and(
      eq(users.id, userId),
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
    ),
    columns: { id: true },
  })
  if (!user) return { success: false, error: 'Licencié introuvable' }

  // Récupérer toutes les équipes de la même saison dans ce club
  const teamsInSeason = await db.query.teams.findMany({
    where: and(eq(teams.clubId, clubId), eq(teams.season, team.season)),
    columns: { id: true },
  })
  const teamIdsInSeason = teamsInSeason.map((t) => t.id)

  // Vérifier que le licencié n'est pas déjà dans une équipe de cette saison
  if (teamIdsInSeason.length > 0) {
    const existing = await db.query.teamMembers.findFirst({
      where: and(
        eq(teamMembers.userId, userId),
        inArray(teamMembers.teamId, teamIdsInSeason),
      ),
      columns: { id: true },
    })
    if (existing) {
      return {
        success: false,
        error: 'Ce licencié est déjà dans une équipe pour la saison ' + team.season,
      }
    }
  }

  await db.insert(teamMembers).values({
    id: crypto.randomUUID(),
    teamId,
    userId,
    clubId,
  })

  revalidatePath(`${REVALIDATE_TEAMS}/${teamId}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// removePlayerFromTeam — retire un joueur d'une équipe
// ---------------------------------------------------------------------------
export async function removePlayerFromTeam(
  teamId: string,
  userId: string,
): Promise<ActionResult> {
  const { clubId } = await getAdminContext()

  // Ownership check : l'équipe doit appartenir au club
  const team = await db.query.teams.findFirst({
    where: and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
    columns: { id: true },
  })
  if (!team) return { success: false, error: 'Équipe introuvable' }

  await db
    .delete(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, userId),
        eq(teamMembers.clubId, clubId),
      ),
    )

  revalidatePath(`${REVALIDATE_TEAMS}/${teamId}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// listAvailablePlayers — licenciés du club pas encore dans une équipe de la saison
// ---------------------------------------------------------------------------
export async function listAvailablePlayers(teamId: string) {
  const { clubId } = await getAdminContext()

  const team = await db.query.teams.findFirst({
    where: and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
    columns: { id: true, season: true },
  })
  if (!team) return []

  // Tous les teamIds de la même saison
  const teamsInSeason = await db.query.teams.findMany({
    where: and(eq(teams.clubId, clubId), eq(teams.season, team.season)),
    columns: { id: true },
  })
  const teamIdsInSeason = teamsInSeason.map((t) => t.id)

  // UserIds déjà assignés à une équipe cette saison
  let takenIds: string[] = []
  if (teamIdsInSeason.length > 0) {
    const taken = await db.query.teamMembers.findMany({
      where: inArray(teamMembers.teamId, teamIdsInSeason),
      columns: { userId: true },
    })
    takenIds = taken.map((m) => m.userId)
  }

  return db.query.users.findMany({
    where: and(
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
      takenIds.length > 0 ? notInArray(users.id, takenIds) : undefined,
    ),
    columns: { id: true, name: true, role: true },
    orderBy: (u, { asc }) => [asc(u.name)],
  })
}

// ---------------------------------------------------------------------------
// listTeamCategories — catégories uniques des équipes du club (triées)
// ---------------------------------------------------------------------------
export async function listTeamCategories() {
  const { clubId } = await getAdminContext()

  const rows = await db.query.teams.findMany({
    where: eq(teams.clubId, clubId),
    columns: { category: true },
  })

  return [...new Set(rows.map((r) => r.category))].sort()
}

// ---------------------------------------------------------------------------
// listManagers — licenciés avec rôle manager_sportif ou admin
// ---------------------------------------------------------------------------
export async function listManagers() {
  const { clubId } = await getAdminContext()

  return db.query.users.findMany({
    where: and(
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
      inArray(users.role, ['manager_sportif', 'admin']),
    ),
    columns: { id: true, name: true, role: true },
    orderBy: (u, { asc }) => [asc(u.name)],
  })
}
