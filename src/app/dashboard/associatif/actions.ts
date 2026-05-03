'use server'

import { db } from '@/db'
import { events, eventTasks, eventRegistrations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { createEventTaskSchema } from '@/lib/validations'
import { eq, and, gte, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

// ===========================================================================
// AUTH HELPERS
// ===========================================================================

async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { userId: session.user.id, clubId, role }
}

async function requireAssociatifWrite() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, ['admin', 'manager_associatif'])
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  return { userId: session.user.id, clubId }
}

// ===========================================================================
// LECTURE
// ===========================================================================

// ---------------------------------------------------------------------------
// listAssociatifEvents — tous les événements du club (passés 60j + à venir)
// avec compteurs de tâches et d'inscrits pour la vue liste
// ---------------------------------------------------------------------------
export async function listAssociatifEvents() {
  const { clubId } = await requireAssociatifWrite()

  const since = new Date()
  since.setDate(since.getDate() - 60)

  return db.query.events.findMany({
    where: and(eq(events.clubId, clubId), gte(events.date, since)),
    with: {
      team:          { columns: { id: true, name: true } },
      tasks:         { columns: { id: true, done: true } },
      registrations: { columns: { id: true } },
    },
    orderBy: (e, { desc }) => [desc(e.date)],
  })
}

// ---------------------------------------------------------------------------
// getEventDetail — détail complet : tâches + assignees + inscrits
// ---------------------------------------------------------------------------
export async function getEventDetail(eventId: string) {
  const { clubId } = await requireAssociatifWrite()

  return db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    with: {
      team: { columns: { id: true, name: true } },
      tasks: {
        with: { assignee: { columns: { id: true, name: true } } },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      },
      registrations: {
        with: { user: { columns: { id: true, name: true, email: true } } },
        orderBy: (r, { asc }) => [asc(r.createdAt)],
      },
    },
  })
}

// ---------------------------------------------------------------------------
// getEventForUser — vue utilisateur : infos + ses tâches + son statut d'inscription
// ---------------------------------------------------------------------------
export async function getEventForUser(eventId: string) {
  const { userId, clubId } = await getSessionContext()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    with: {
      team:          { columns: { id: true, name: true } },
      registrations: { columns: { id: true } },
      tasks: {
        where: (t, { eq: eqFn }) => eqFn(t.assigneeId, userId),
        columns: { id: true, title: true, done: true },
      },
    },
  })

  if (!event) return null

  const myReg = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.userId, userId),
    ),
    columns: { id: true },
  })

  return { event, isRegistered: !!myReg }
}

// ---------------------------------------------------------------------------
// listClubMembers — liste des membres actifs pour le sélecteur d'assignée
// ---------------------------------------------------------------------------
export async function listClubMembers() {
  const { clubId } = await requireAssociatifWrite()

  return db.query.users.findMany({
    where: and(eq(users.clubId, clubId), isNull(users.deletedAt)),
    columns: { id: true, name: true },
    orderBy: (u, { asc }) => [asc(u.name)],
  })
}

// ===========================================================================
// TÂCHES
// ===========================================================================

// ---------------------------------------------------------------------------
// createTask — Manager Associatif + Admin
// ---------------------------------------------------------------------------
export async function createTask(
  eventId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId } = await requireAssociatifWrite()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { id: true },
  })
  if (!event) return { success: false, error: 'Événement introuvable' }

  const parsed = createEventTaskSchema.safeParse({
    title:      formData.get('title'),
    assigneeId: formData.get('assigneeId') || undefined,
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  if (parsed.data.assigneeId) {
    const user = await db.query.users.findFirst({
      where: and(
        eq(users.id, parsed.data.assigneeId),
        eq(users.clubId, clubId),
        isNull(users.deletedAt),
      ),
      columns: { id: true },
    })
    if (!user) return { success: false, error: 'Bénévole introuvable' }
  }

  await db.insert(eventTasks).values({
    id:         crypto.randomUUID(),
    eventId,
    assigneeId: parsed.data.assigneeId ?? null,
    title:      parsed.data.title,
    done:       false,
  })

  revalidatePath(`/dashboard/manager-associatif/events/${eventId}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// toggleTaskDone — Manager Associatif, Admin, ou bénévole assigné
// ---------------------------------------------------------------------------
export async function toggleTaskDone(taskId: string): Promise<ActionResult> {
  const { userId, clubId, role } = await getSessionContext()

  const task = await db.query.eventTasks.findFirst({
    where: eq(eventTasks.id, taskId),
    with: { event: { columns: { id: true, clubId: true } } },
    columns: { id: true, done: true, assigneeId: true },
  })

  if (!task || task.event.clubId !== clubId) {
    return { success: false, error: 'Tâche introuvable' }
  }

  const canToggle =
    role === 'admin' ||
    role === 'manager_associatif' ||
    task.assigneeId === userId

  if (!canToggle) return { success: false, error: 'Accès refusé' }

  await db
    .update(eventTasks)
    .set({ done: !task.done })
    .where(eq(eventTasks.id, taskId))

  revalidatePath(`/dashboard/manager-associatif/events/${task.event.id}`)
  revalidatePath(`/dashboard/events/${task.event.id}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteTask — Manager Associatif + Admin
// ---------------------------------------------------------------------------
export async function deleteTask(taskId: string): Promise<ActionResult> {
  const { clubId } = await requireAssociatifWrite()

  const task = await db.query.eventTasks.findFirst({
    where: eq(eventTasks.id, taskId),
    with: { event: { columns: { id: true, clubId: true } } },
    columns: { id: true },
  })

  if (!task || task.event.clubId !== clubId) {
    return { success: false, error: 'Tâche introuvable' }
  }

  await db.delete(eventTasks).where(eq(eventTasks.id, taskId))

  revalidatePath(`/dashboard/manager-associatif/events/${task.event.id}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// assignTask — Manager Associatif + Admin
// ---------------------------------------------------------------------------
export async function assignTask(
  taskId: string,
  assigneeId: string | null,
): Promise<ActionResult> {
  const { clubId } = await requireAssociatifWrite()

  const task = await db.query.eventTasks.findFirst({
    where: eq(eventTasks.id, taskId),
    with: { event: { columns: { id: true, clubId: true } } },
    columns: { id: true },
  })

  if (!task || task.event.clubId !== clubId) {
    return { success: false, error: 'Tâche introuvable' }
  }

  if (assigneeId) {
    const user = await db.query.users.findFirst({
      where: and(eq(users.id, assigneeId), eq(users.clubId, clubId), isNull(users.deletedAt)),
      columns: { id: true },
    })
    if (!user) return { success: false, error: 'Utilisateur introuvable' }
  }

  await db
    .update(eventTasks)
    .set({ assigneeId: assigneeId ?? null })
    .where(eq(eventTasks.id, taskId))

  revalidatePath(`/dashboard/manager-associatif/events/${task.event.id}`)
  return { success: true, data: undefined }
}

// ===========================================================================
// INSCRIPTIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// registerForEvent — tout utilisateur authentifié
// ---------------------------------------------------------------------------
export async function registerForEvent(eventId: string): Promise<ActionResult> {
  const { userId, clubId } = await getSessionContext()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { id: true },
  })
  if (!event) return { success: false, error: 'Événement introuvable' }

  const existing = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.userId, userId),
    ),
    columns: { id: true },
  })
  if (existing) return { success: false, error: 'Déjà inscrit à cet événement' }

  await db.insert(eventRegistrations).values({
    id: crypto.randomUUID(),
    eventId,
    userId,
  })

  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath(`/dashboard/manager-associatif/events/${eventId}`)
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// unregisterFromEvent — tout utilisateur authentifié (sa propre inscription)
// ---------------------------------------------------------------------------
export async function unregisterFromEvent(eventId: string): Promise<ActionResult> {
  const { userId } = await getSessionContext()

  await db.delete(eventRegistrations).where(
    and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.userId, userId),
    ),
  )

  revalidatePath(`/dashboard/events/${eventId}`)
  revalidatePath(`/dashboard/manager-associatif/events/${eventId}`)
  return { success: true, data: undefined }
}
