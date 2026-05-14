'use server'

import { db } from '@/db'
import { events, teams, teamMembers, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { listManagedTeamIds } from '@/lib/team-managers'
import { createEventSchema, updateEventSchema } from '@/lib/validations'
import { eq, and, gte, lte, inArray, isNull, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { EventType, UserRole } from '@/db/schema'
import type { SQL } from 'drizzle-orm'

const REVALIDATE = '/dashboard/team/calendar'

// ---------------------------------------------------------------------------
// Helpers locaux — même pattern que admin/actions.ts (auth.api.getSession direct)
// Évite le passage par session.ts qui cause "Failed to get session" en SSR
// ---------------------------------------------------------------------------

async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const userId = session.user.id
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  return { userId, clubId, roles }
}

async function requireEventAuth(allowedRoles: UserRole[]) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, allowedRoles)
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  return { user: session.user, userId: session.user.id, clubId, roles }
}

// ===========================================================================
// LECTURE
// ===========================================================================

export type EventFilters = {
  teamId?: string
  type?: string
  month?: string                        // 'YYYY-MM' — vue mensuelle
  dateRange?: { start: Date; end: Date } // vues semaine / jour
}

// ---------------------------------------------------------------------------
// listEvents — visibilité selon les rôles :
//   admin           → tous les événements du club
//   manager         → ses équipes gérées + événements club (teamId null)
//   sinon (user)    → ses équipes dont il est membre + événements club
// ---------------------------------------------------------------------------
export async function listEvents(filters?: EventFilters) {
  const { userId, clubId, roles } = await getSessionContext()

  // Plage de dates
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (filters?.dateRange) {
    startDate = filters.dateRange.start
    endDate = filters.dateRange.end
  } else if (filters?.month) {
    const [year, month] = filters.month.split('-').map(Number)
    startDate = new Date(year, month - 1, 1)
    endDate = new Date(year, month, 0, 23, 59, 59)
  }

  // Filtre de visibilité
  let visibilityCondition: SQL<unknown> | undefined

  if (roles.includes('admin')) {
    // Aucun filtre — admin voit tout le club
  } else if (roles.includes('manager')) {
    const teamIds = await listManagedTeamIds(userId, clubId)
    visibilityCondition =
      teamIds.length > 0
        ? or(isNull(events.teamId), inArray(events.teamId, teamIds))
        : isNull(events.teamId)
  } else {
    const memberships = await db.query.teamMembers.findMany({
      where: and(eq(teamMembers.userId, userId), eq(teamMembers.clubId, clubId)),
      columns: { teamId: true },
    })
    const teamIds = memberships.map((m) => m.teamId)
    visibilityCondition =
      teamIds.length > 0
        ? or(isNull(events.teamId), inArray(events.teamId, teamIds))
        : isNull(events.teamId)
  }

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
// listAccessibleTeams — pour le filtre calendrier
// ---------------------------------------------------------------------------
export async function listAccessibleTeams() {
  const { userId, clubId, roles } = await getSessionContext()

  if (roles.includes('admin')) {
    return db.query.teams.findMany({
      where: eq(teams.clubId, clubId),
      columns: { id: true, name: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  }

  if (roles.includes('manager')) {
    const teamIds = await listManagedTeamIds(userId, clubId)
    if (teamIds.length === 0) return []
    return db.query.teams.findMany({
      where: and(eq(teams.clubId, clubId), inArray(teams.id, teamIds)),
      columns: { id: true, name: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  }

  const memberships = await db.query.teamMembers.findMany({
    where: and(eq(teamMembers.userId, userId), eq(teamMembers.clubId, clubId)),
    with: { team: { columns: { id: true, name: true } } },
  })
  return memberships.map((m) => m.team).filter(Boolean)
}

// ---------------------------------------------------------------------------
// listAdminEvents — tous les événements du club (passés 60j + à venir)
// Réservé à l'Admin pour la vue liste /dashboard/admin/events
// ---------------------------------------------------------------------------
export async function listAdminEvents() {
  const { clubId } = await requireEventAuth(['admin'])

  const since = new Date()
  since.setDate(since.getDate() - 60)

  return db.query.events.findMany({
    where: and(eq(events.clubId, clubId), gte(events.date, since)),
    with: {
      team: { columns: { id: true, name: true } },
    },
    orderBy: (e, { desc }) => [desc(e.date)],
  })
}

// ---------------------------------------------------------------------------
// listManagerEvents — événements des équipes gérées (passés 60j + à venir)
// Réservé au Manager Sportif pour la vue liste /dashboard/team/calendar
// ---------------------------------------------------------------------------
export async function listManagerEvents() {
  const { user, clubId, roles } = await requireEventAuth(['admin', 'manager'])

  const since = new Date()
  since.setDate(since.getDate() - 60)

  // Admin voit tout ; manager (sans admin) ne voit que ses équipes
  let teamCondition = undefined
  if (!roles.includes('admin')) {
    const teamIds = await listManagedTeamIds(user.id, clubId)
    if (teamIds.length === 0) return []
    teamCondition = inArray(events.teamId, teamIds)
  }

  return db.query.events.findMany({
    where: and(eq(events.clubId, clubId), gte(events.date, since), teamCondition),
    with: {
      team: { columns: { id: true, name: true } },
    },
    orderBy: (e, { desc }) => [desc(e.date)],
  })
}

// ---------------------------------------------------------------------------
// listEventFormTeams — pour le formulaire de création
// ---------------------------------------------------------------------------
export async function listEventFormTeams() {
  const { user, clubId, roles } = await requireEventAuth(['admin', 'manager'])

  if (!roles.includes('admin')) {
    const teamIds = await listManagedTeamIds(user.id, clubId)
    if (teamIds.length === 0) return []
    return db.query.teams.findMany({
      where: and(eq(teams.clubId, clubId), inArray(teams.id, teamIds)),
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
// getEvent — détail (ownership check)
// ---------------------------------------------------------------------------
export async function getEvent(id: string) {
  const { clubId } = await getSessionContext()

  return db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.clubId, clubId)),
    with: { team: { columns: { id: true, name: true } } },
  })
}

// ===========================================================================
// NOTIFICATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// sendEventNotification — fire-and-forget, ne bloque pas l'action
// Envoie un email à :
//   - les membres de l'équipe (si teamId)
//   - tous les membres du club (si pas de teamId — événement club)
// ---------------------------------------------------------------------------
async function sendEventNotification(params: {
  clubId: string
  teamId?: string | null
  title: string
  type: EventType
  date: Date
  location?: string | null
}) {
  if (!process.env.RESEND_API_KEY) return // non configuré en dev → skip

  const { clubId, teamId, title, type, date, location } = params

  // Récupérer les destinataires
  let recipients: { email: string; name: string | null }[] = []

  if (teamId) {
    // Membres de l'équipe
    const rows = await db
      .select({ email: users.email, name: users.name })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.clubId, clubId),
          isNull(users.deletedAt),
        ),
      )
    recipients = rows
  } else {
    // Tous les membres du club
    const rows = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.clubId, clubId), isNull(users.deletedAt)))
    recipients = rows
  }

  if (recipients.length === 0) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const typeLabels: Record<EventType, string> = {
    match: 'Match',
    training: 'Entraînement',
    other: 'Événement',
  }
  const typeLabel = typeLabels[type]

  const dateStr = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Envoi individuel pour préserver la confidentialité des emails
  await Promise.allSettled(
    recipients.map(({ email }) =>
      resend.emails.send({
        from: 'ClubOS <onboarding@resend.dev>',
        to: email,
        subject: `[ClubOS] ${typeLabel} : ${title}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#353148;margin-bottom:4px">${typeLabel} : ${title}</h2>
            <p style="color:#353148;margin:8px 0">
              <strong>Date :</strong> ${dateStr} à ${timeStr}
            </p>
            ${location ? `<p style="color:#353148;margin:8px 0"><strong>Lieu :</strong> ${location}</p>` : ''}
            <div style="margin-top:24px;padding:16px;background:#f3f0ff;border-radius:8px">
              <p style="color:#8c60f3;margin:0;font-size:14px">
                Connectez-vous sur ClubOS pour plus d&apos;informations.
              </p>
            </div>
          </div>
        `,
      }),
    ),
  )
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// createEvent — Admin + Manager
// ---------------------------------------------------------------------------
export async function createEvent(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, clubId, roles } = await requireEventAuth(['admin', 'manager'])

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

  // Manager (sans admin) : doit choisir une de ses équipes
  if (!roles.includes('admin')) {
    if (!teamId) {
      return { success: false, error: 'Veuillez sélectionner une équipe' }
    }
    const managedIds = await listManagedTeamIds(user.id, clubId)
    if (!managedIds.includes(teamId)) {
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

  const eventDate = new Date(date)

  await db.insert(events).values({
    id: crypto.randomUUID(),
    clubId,
    teamId: teamId ?? null,
    type: type as EventType,
    title,
    date: eventDate,
    location: location ?? null,
  })

  // Notification email — ne bloque pas en cas d'erreur
  try {
    await sendEventNotification({
      clubId,
      teamId: teamId ?? null,
      title,
      type: type as EventType,
      date: eventDate,
      location: location ?? null,
    })
  } catch {
    // Échec silencieux — la création de l'événement est déjà confirmée
  }

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// updateEvent — Admin + Manager Sportif
// ---------------------------------------------------------------------------
export async function updateEvent(
  id: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, clubId, roles } = await requireEventAuth(['admin', 'manager'])

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

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, id), eq(events.clubId, clubId)),
    columns: { id: true, teamId: true },
  })
  if (!event) return { success: false, error: 'Événement introuvable' }

  if (!roles.includes('admin')) {
    if (!event.teamId) {
      return { success: false, error: 'Accès refusé à cet événement' }
    }
    const managedIds = await listManagedTeamIds(user.id, clubId)
    if (!managedIds.includes(event.teamId)) {
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
// deleteEvent — Admin uniquement
// ---------------------------------------------------------------------------
export async function deleteEvent(id: string): Promise<ActionResult> {
  const { clubId } = await requireEventAuth(['admin'])

  await db.delete(events).where(and(eq(events.id, id), eq(events.clubId, clubId)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}
