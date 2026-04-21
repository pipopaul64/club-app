'use server'

import { db } from '@/db'
import { events, teams, teamMembers, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { createEventSchema, updateEventSchema } from '@/lib/validations'
import { eq, and, gte, lte, inArray, isNull, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { EventType, UserRole } from '@/db/schema'
import type { SQL } from 'drizzle-orm'

const REVALIDATE = '/dashboard/calendar'

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
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { userId, clubId, role }
}

async function requireEventAuth(allowedRoles: UserRole[]) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, allowedRoles)
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { user: session.user, userId: session.user.id, clubId, role }
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
// listEvents — visibilité selon le rôle :
//   user        → équipes dont il est membre + événements club (teamId null)
//   manager     → ses équipes gérées + événements club
//   admin/assoc → tous les événements du club
// ---------------------------------------------------------------------------
export async function listEvents(filters?: EventFilters) {
  const { userId, clubId, role } = await getSessionContext()

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
// listEventFormTeams — pour le formulaire de création
// ---------------------------------------------------------------------------
export async function listEventFormTeams() {
  const { user, clubId, role } = await requireEventAuth([
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
  let recipients: { email: string; name: string }[] = []

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
// createEvent — Admin + Manager Sportif + Manager Associatif
// ---------------------------------------------------------------------------
export async function createEvent(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { user, clubId, role } = await requireEventAuth([
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
  const { user, clubId, role } = await requireEventAuth(['admin', 'manager_sportif'])

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
// deleteEvent — Admin uniquement
// ---------------------------------------------------------------------------
export async function deleteEvent(id: string): Promise<ActionResult> {
  const { clubId } = await requireEventAuth(['admin'])

  await db.delete(events).where(and(eq(events.id, id), eq(events.clubId, clubId)))

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}
