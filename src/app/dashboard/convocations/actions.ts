'use server'

import { db } from '@/db'
import { convocations, events, teams, teamMembers, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { isManagerOfTeam, listManagedTeamIds } from '@/lib/team-managers'
import { createConvocationSchema } from '@/lib/validations'
import { eq, and, inArray, isNull, gte } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { ConvocationStatus, EventType, UserRole } from '@/db/schema'

// ===========================================================================
// HELPERS D'AUTH — pattern direct (pas de session.ts intermédiaire)
// ===========================================================================

async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  return { userId: session.user.id, clubId, roles, user: session.user }
}

async function requireManagerAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, ['admin', 'manager'])
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  return { userId: session.user.id, clubId, roles, user: session.user }
}

// Vérifie que l'utilisateur a bien accès à l'événement
// (admin = tout, sinon = vérifier que l'événement est sur une équipe qu'il gère)
async function assertEventAccess(
  eventId: string,
  clubId: string,
  userId: string,
  roles: UserRole[],
) {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { id: true, teamId: true, clubId: true, title: true, type: true, date: true, location: true, createdAt: true },
  })
  if (!event) throw new Error('Événement introuvable')
  if (!roles.includes('admin')) {
    if (!event.teamId || !(await isManagerOfTeam(userId, event.teamId))) {
      throw new Error('Vous ne gérez pas cet événement')
    }
  }
  return event
}

// ===========================================================================
// LECTURE
// ===========================================================================

// ---------------------------------------------------------------------------
// listEligibleEvents — événements à venir gérés par le manager courant
// ---------------------------------------------------------------------------
export async function listEligibleEvents() {
  const { userId, clubId, roles } = await getSessionContext()

  const now = new Date()

  if (roles.includes('admin')) {
    return db.query.events.findMany({
      where: and(eq(events.clubId, clubId), gte(events.date, now)),
      with: { team: { columns: { id: true, name: true } } },
      orderBy: (e, { asc }) => [asc(e.date)],
    })
  }

  // manager (sans admin) : uniquement ses équipes
  const teamIds = await listManagedTeamIds(userId, clubId)

  if (teamIds.length === 0) return []

  return db.query.events.findMany({
    where: and(
      eq(events.clubId, clubId),
      gte(events.date, now),
      inArray(events.teamId, teamIds),
    ),
    with: { team: { columns: { id: true, name: true } } },
    orderBy: (e, { asc }) => [asc(e.date)],
  })
}

// ---------------------------------------------------------------------------
// listConvocationsForEvent — toutes les convocations d'un événement
// ---------------------------------------------------------------------------
export async function listConvocationsForEvent(eventId: string) {
  const { clubId } = await getSessionContext()

  // Vérifier que l'événement appartient bien au club
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { id: true },
  })
  if (!event) throw new Error('Événement introuvable')

  return db.query.convocations.findMany({
    where: eq(convocations.eventId, eventId),
    with: {
      user: { columns: { id: true, name: true, email: true } },
    },
    orderBy: (c, { asc }) => [asc(c.createdAt)],
  })
}

// ---------------------------------------------------------------------------
// listAvailablePlayers — membres de l'équipe non encore convoqués
// ---------------------------------------------------------------------------
export async function listAvailablePlayers(eventId: string) {
  const { clubId } = await getSessionContext()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { id: true, teamId: true },
  })
  if (!event || !event.teamId) return []

  // Membres déjà convoqués
  const existingConvocations = await db.query.convocations.findMany({
    where: eq(convocations.eventId, eventId),
    columns: { userId: true },
  })
  const alreadyConvokedIds = new Set(existingConvocations.map((c) => c.userId))

  // Tous les membres de l'équipe
  const members = await db
    .select({ id: users.id, name: users.name })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(
      and(
        eq(teamMembers.teamId, event.teamId),
        eq(teamMembers.clubId, clubId),
        isNull(users.deletedAt),
      ),
    )

  return members.filter((m) => !alreadyConvokedIds.has(m.id))
}

// ---------------------------------------------------------------------------
// listTeamEventsSummary — événements d'UNE équipe (passés 60 j + à venir)
// avec le nombre de convocations. Accessible aux membres + managers + admin
// de l'équipe. Utilisé par /dashboard/team/convocations (lecture pour user,
// gestion pour manager/admin).
// ---------------------------------------------------------------------------
export async function listTeamEventsSummary(teamId: string) {
  const { userId, clubId, roles } = await getSessionContext()

  // Vérifier que l'utilisateur a une relation avec cette équipe
  const team = await db.query.teams.findFirst({
    where:   and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
    columns: { id: true },
  })
  if (!team) throw new Error('Équipe introuvable')

  if (!roles.includes('admin')) {
    const [membership, isManager] = await Promise.all([
      db.query.teamMembers.findFirst({
        where:   and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)),
        columns: { id: true },
      }),
      isManagerOfTeam(userId, teamId),
    ])
    if (!membership && !isManager) {
      throw new Error("Vous n'avez pas accès à cette équipe")
    }
  }

  const since = new Date()
  since.setDate(since.getDate() - 60)

  return db.query.events.findMany({
    where: and(
      eq(events.clubId, clubId),
      gte(events.date, since),
      eq(events.teamId, teamId),
    ),
    with: {
      team:         { columns: { id: true, name: true } },
      convocations: { columns: { id: true } },
    },
    orderBy: (e, { desc }) => [desc(e.date)],
  })
}

// ---------------------------------------------------------------------------
// listManagerEventsSummary — tous les événements des équipes du manager
// (passés 60 j + à venir) avec le nombre de convocations par événement.
// (Conservé pour compat éventuelle ; non utilisé directement.)
// ---------------------------------------------------------------------------
export async function listManagerEventsSummary() {
  const { userId, clubId, roles } = await requireManagerAuth()

  let teamIds: string[] = []

  if (roles.includes('admin')) {
    const allTeams = await db.query.teams.findMany({
      where: eq(teams.clubId, clubId),
      columns: { id: true },
    })
    teamIds = allTeams.map((t) => t.id)
  } else {
    teamIds = await listManagedTeamIds(userId, clubId)
  }

  if (teamIds.length === 0) return []

  const since = new Date()
  since.setDate(since.getDate() - 60)

  return db.query.events.findMany({
    where: and(
      eq(events.clubId, clubId),
      gte(events.date, since),
      inArray(events.teamId, teamIds),
    ),
    with: {
      team:         { columns: { id: true, name: true } },
      convocations: { columns: { id: true } },
    },
    orderBy: (e, { desc }) => [desc(e.date)],
  })
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// createConvocation — Manager Sportif / Admin
// Retourne { success: true, data: { eventId } } pour que le client redirige
// ---------------------------------------------------------------------------
export async function createConvocation(
  _prevState: ActionResult<{ eventId: string }>,
  formData: FormData,
): Promise<ActionResult<{ eventId: string }>> {
  const { userId, clubId, roles } = await requireManagerAuth()

  const rawUserIds = formData.getAll('userIds') as string[]
  const eventId = formData.get('eventId') as string

  const parsed = createConvocationSchema.safeParse({ eventId, userIds: rawUserIds })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  // Vérifier accès à l'événement
  let event
  try {
    event = await assertEventAccess(parsed.data.eventId, clubId, userId, roles)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Manager (sans admin) : l'événement doit avoir une équipe
  if (!roles.includes('admin') && !event.teamId) {
    return { success: false, error: 'Cet événement n\'est pas associé à une équipe' }
  }

  // Vérifier que les userId appartiennent au club
  const validUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.clubId, clubId),
        inArray(users.id, parsed.data.userIds),
        isNull(users.deletedAt),
      ),
    )
  const validIds = new Set(validUsers.map((u) => u.id))

  // Exclure les joueurs déjà convoqués pour cet événement
  const existing = await db.query.convocations.findMany({
    where: and(
      eq(convocations.eventId, parsed.data.eventId),
      inArray(convocations.userId, parsed.data.userIds),
    ),
    columns: { userId: true },
  })
  const existingIds = new Set(existing.map((c) => c.userId))

  const toInsert = parsed.data.userIds.filter(
    (id) => validIds.has(id) && !existingIds.has(id),
  )

  if (toInsert.length === 0) {
    return { success: false, error: 'Aucun nouveau joueur à convoquer' }
  }

  await db.insert(convocations).values(
    toInsert.map((uid) => ({
      id: crypto.randomUUID(),
      eventId: parsed.data.eventId,
      userId: uid,
      status: 'pending' as ConvocationStatus,
      isStarter: null,
    })),
  )

  // Notification email
  try {
    await sendConvocationNotification({
      eventId: parsed.data.eventId,
      userIds: toInsert,
      clubId,
    })
  } catch {
    // Échec silencieux
  }

  revalidatePath('/dashboard/team/convocations')
  revalidatePath(`/dashboard/team/convocations/${parsed.data.eventId}`)
  return { success: true, data: { eventId: parsed.data.eventId } }
}

// ---------------------------------------------------------------------------
// updateComposition — set titulaires / remplaçants
// Appelé via updateComposition.bind(null, eventId) pour useActionState
// ---------------------------------------------------------------------------
export async function updateComposition(
  eventId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { userId, clubId, roles } = await requireManagerAuth()

  try {
    await assertEventAccess(eventId, clubId, userId, roles)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Récupérer toutes les convocations de l'événement
  const eventConvocations = await db.query.convocations.findMany({
    where: eq(convocations.eventId, eventId),
    columns: { id: true, userId: true },
  })

  // Mettre à jour isStarter pour chaque convocation
  await Promise.all(
    eventConvocations.map((conv) => {
      const raw = formData.get(`pos_${conv.userId}`)
      const isStarter =
        raw === 'starter' ? true : raw === 'substitute' ? false : null

      return db
        .update(convocations)
        .set({ isStarter })
        .where(eq(convocations.id, conv.id))
    }),
  )

  revalidatePath(`/dashboard/team/convocations/${eventId}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// removeFromConvocation — retirer un joueur d'une convocation
// ---------------------------------------------------------------------------
export async function removeFromConvocation(
  convocationId: string,
): Promise<ActionResult> {
  const { userId, clubId, roles } = await requireManagerAuth()

  const conv = await db.query.convocations.findFirst({
    where: eq(convocations.id, convocationId),
    with: { event: { columns: { id: true, clubId: true, teamId: true } } },
  })
  if (!conv || conv.event.clubId !== clubId) {
    return { success: false, error: 'Convocation introuvable' }
  }

  // Manager (sans admin) : vérifier accès à l'événement
  if (!roles.includes('admin')) {
    try {
      await assertEventAccess(conv.event.id, clubId, userId, roles)
    } catch (e) {
      return { success: false, error: (e as Error).message }
    }
  }

  await db.delete(convocations).where(eq(convocations.id, convocationId))

  revalidatePath(`/dashboard/team/convocations/${conv.event.id}`)
  revalidatePath('/dashboard/team/convocations')
  return { success: true, data: undefined }
}

// Note : `updateConvocationStatus` (player accepts/declines) a été retirée
// avec /dashboard/club/convocations. À ré-introduire si une UI joueur revient.

// ===========================================================================
// NOTIFICATIONS
// ===========================================================================

async function sendConvocationNotification(params: {
  eventId: string
  userIds: string[]
  clubId: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { eventId, userIds, clubId } = params

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { title: true, type: true, date: true, location: true },
  })
  if (!event) return

  const recipients = await db
    .select({ email: users.email, name: users.name })
    .from(users)
    .where(and(inArray(users.id, userIds), isNull(users.deletedAt)))

  if (recipients.length === 0) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const typeLabels: Record<string, string> = {
    match: 'Match', training: 'Entraînement', other: 'Événement',
  }
  const typeLabel = typeLabels[event.type as EventType] ?? 'Événement'
  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  await Promise.allSettled(
    recipients.map(({ email, name }) =>
      resend.emails.send({
        from: 'ClubOS <onboarding@resend.dev>',
        to: email,
        subject: `[ClubOS] Tu es convoqué(e) : ${typeLabel} — ${event.title}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#353148;margin-bottom:4px">Tu es convoqué(e) ! 🎉</h2>
            <p style="color:#353148">Bonjour ${name},</p>
            <p style="color:#353148">Tu as été convoqué(e) pour :</p>
            <h3 style="color:#353148;margin:8px 0">${typeLabel} — ${event.title}</h3>
            <p style="color:#353148;margin:4px 0"><strong>Date :</strong> ${dateStr} à ${timeStr}</p>
            ${event.location ? `<p style="color:#353148;margin:4px 0"><strong>Lieu :</strong> ${event.location}</p>` : ''}
            <div style="margin-top:24px;padding:16px;background:#f3f0ff;border-radius:8px">
              <p style="color:#8c60f3;margin:0;font-size:14px">
                Connectez-vous sur ClubOS pour confirmer ou décliner votre convocation.
              </p>
            </div>
          </div>
        `,
      }),
    ),
  )
}
