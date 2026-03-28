'use server'

import { db } from '@/db'
import { events, teams, teamMembers } from '@/db/schema'
import { requireAuth, requireSessionWithClub } from '@/lib/session'
import { createEventSchema, updateEventSchema } from '@/lib/validations'
import { eq, and, gte, lte, inArray, isNull, or } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { EventType, UserRole } from '@/db/schema'
import type { SQL } from 'drizzle-orm'

const REVALIDATE = '/dashboard/calendar'

// ---------------------------------------------------------------------------
// getSessionContext — session + clubId + role (depuis le cookie, pas de DB check)
// Utilisé pour les lectures (listEvents, listAccessibleTeams) accessibles à tous
// ---------------------------------------------------------------------------
async function getSessionContext() {
  const { session, clubId } = await requireSessionWithClub()
  const userId = session.user.id
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { userId, clubId, role }
}

// ===========================================================================
// LECTURE
// ===========================================================================

export type EventFilters = {
  teamId?: string
  type?: string
  month?: string // format 'YYYY-MM'
}

// ---------------------------------------------------------------------------
// listEvents — tous les rôles, filtre de visibilité selon le rôle
// User        → événements de son équipe + événements du club (teamId null)
// Manager     → événements de ses équipes + événements du club
// Admin/Assoc → tous les événements du club
// ---------------------------------------------------------------------------
export async function listEvents(filters?: EventFilters) {
  const { userId, clubId, role } = await getSessionContext()

  // Plage de dates pour le mois demandé
  let startDate: Date | undefined
  let endDate: Date | undefined
  if (filters?.month) {
    const [year, month] = filters.month.split('-').map(Number)
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 0, 23, 59, 59)
  }

  // Filtre de visibilité selon le rôle
  let visibilityCondition: SQL<unknown> | undefined

  if (role === 'user') {
    const memberships = await db.query.teamMembers.findMany({
      where: and(eq(teamMembers.userId, userId), eq(teamMembers.clubId, clubId)),
      columns: { teamId: true },
    })
    const teamIds = memberships.map((m) => m.teamId)
    visibilityCondition =
      teamIds.length > 0
        ? or(isNull(events.teamId), inArray(events.teamId, teamIds))
        : isNull(events.teamId)
  } else if (role === 'manager_sportif') {
    const managedTeams = await db.query.teams.findMany({
      where: and(eq(teams.managerId, userId), eq(teams.clubId, clubId)),
      columns: { id: true },
    })
    const teamIds = managedTeams.map((t) => t.id)
    visibilityCondition =
      teamIds.length > 0
        ? or(isNull(events.teamId), inArray(events.teamId, teamIds))
        : isNull(events.teamId)
  }
  // admin et manager_associatif : pas de restriction de visibilité

  return db.query.events.findMany({
    where: and(
      eq(events.clubId, clubId),
      visibilityCondition,
      filters?.teamId ? eq(events.teamId, filters.teamId) : undefined,
      filters?.type ? eq(events.type, filters.type as EventType) : undefined,
      startDate ? gte(events.date, startDate) : undefined,
      endDate ? lte(events.date, endDate) : undefined,
    ),
    with: {
      team: { columns: { id: true, name: true } },
    },
    orderBy: (e, { asc }) => [asc(e.date)],
  })
}

// ---------------------------------------------------------------------------
// listAccessibleTeams — équipes visibles selon le rôle (pour le filtre calendrier)
// ---------------------------------------------------------------------------
export async function listAccessibleTeams() {
  const { userId, clubId, role } = await getSessionContext()

  if (role === 'user') {
    const memberships = await db.query.teamMembers.findMany({
      where: and(eq(teamMembers.userId, userId), eq(teamMembers.clubId, clubId)),
      with: { team: { columns: { id: true, name: true } } },
    })
    return memberships.map((m) => m.team).filter(Boolean)
  }

  if (role === 'manager_sportif') {
    return db.query.teams.findMany({
      where: and(eq(teams.managerId, userId), eq(teams.clubId, clubId)),
      columns: { id: true, name: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  }

  return db.query.teams.findMany({
    where: eq(teams.clubId, clubId),
    columns: { id: true, name: true },
    orderBy: (t, { asc }) => [asc(t.name)],
  })
}

// ---------------------------------------------------------------------------
// listEventFormTeams — équipes disponibles dans le formulaire de création
// Admin/Assoc → toutes les équipes du club
// Manager     → uniquement ses équipes assignées
// ---------------------------------------------------------------------------
export async function listEventFormTeams() {
  const { user, clubId, role } = await requireAuth([
    'admin',
    'manager_sportif',
    'manager_associatif',
  ])

  if (role === 'manager_sportif') {
    return db.query.teams.findMany({
      where: and(eq(teams.managerId, user.id), eq(teams.clubId, clubId)),
      columns: { id: true, name: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  }

  return db.query.teams.findMany({
    where: eq(teams.clubId, clubId),
    columns: { id: true, name: true },
    orderBy: (t, { asc }) => [asc(t.name)],
  })
}

// ---------------------------------------------------------------------------
// getEvent — détail d'un événement (ownership check)
// ---------------------------------------------------------------------------
export async function getEvent(id: string) {
  const { clubId } = await getSessionContext()

  return db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.clubId, clubId)),
    with: { team: { columns: { id: true, name: true } } },
  })
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// createEvent — Admin + Manager Sportif + Manager Associatif
// Manager Sportif : teamId obligatoire + doit être une de ses équipes
// ---------------------------------------------------------------------------
export async function createEvent(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, clubId, role } = await requireAuth([
    'admin',
    'manager_sportif',
    'manager_associatif',
  ])

  const parsed = createEventSchema.safeParse({
    title: formData.get('title'),
    type: formData.get('type'),
    date: formData.get('date'),
    location: formData.get('location') || undefined,
    teamId: formData.get('teamId') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const { title, type, date, location, teamId } = parsed.data

  // Manager Sportif : doit choisir une de ses équipes
  if (role === 'manager_sportif') {
    if (!teamId) {
      return { success: false, error: 'Veuillez sélectionner une équipe' }
    }
    const managed = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, teamId),
        eq(teams.managerId, user.id),
        eq(teams.clubId, clubId),
      ),
      columns: { id: true },
    })
    if (!managed) {
      return { success: false, error: 'Vous ne gérez pas cette équipe' }
    }
  }

  // Si teamId fourni, vérifier qu'il appartient au club
  if (teamId) {
    const team = await db.query.teams.findFirst({
      where: and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
      columns: { id: true },
    })
    if (!team) return { success: false, error: 'Équipe introuvable' }
  }

  await db.insert(events).values({
    id: crypto.randomUUID(),
    clubId,
    teamId: teamId ?? null,
    type: type as EventType,
    title,
    date: new Date(date),
    location: location ?? null,
  })

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// updateEvent — Admin + Manager Sportif
// Manager Sportif : peut modifier uniquement les events de ses équipes
// ---------------------------------------------------------------------------
export async function updateEvent(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, clubId, role } = await requireAuth(['admin', 'manager_sportif'])

  const parsed = updateEventSchema.safeParse({
    title: formData.get('title'),
    type: formData.get('type'),
    date: formData.get('date'),
    location: formData.get('location') || undefined,
    teamId: formData.get('teamId') || undefined,
  })

  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Vérifier que l'événement appartient au club
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.clubId, clubId)),
    columns: { id: true, teamId: true },
  })
  if (!event) return { success: false, error: 'Événement introuvable' }

  // Manager Sportif : ne peut modifier que les events de ses équipes
  if (role === 'manager_sportif') {
    if (!event.teamId) {
      return { success: false, error: 'Accès refusé à cet événement' }
    }
    const managed = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, event.teamId),
        eq(teams.managerId, user.id),
        eq(teams.clubId, clubId),
      ),
      columns: { id: true },
    })
    if (!managed) {
      return { success: false, error: 'Vous ne gérez pas cet événement' }
    }
  }

  const { title, type, date, location, teamId } = parsed.data

  await db
    .update(events)
    .set({
      title,
      type: type as EventType,
      date: new Date(date),
      location: location ?? null,
      teamId: teamId ?? null,
    })
    .where(and(eq(events.id, id), eq(events.clubId, clubId)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteEvent — Admin uniquement, suppression physique (cascade sur convocations…)
// ---------------------------------------------------------------------------
export async function deleteEvent(id: string): Promise<ActionResult> {
  const { clubId } = await requireAuth(['admin'])

  await db.delete(events).where(and(eq(events.id, id), eq(events.clubId, clubId)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}
