'use server'

import { db } from '@/db'
import { events, convocations, presences, performances } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { isManagerOfTeam } from '@/lib/team-managers'
import { eq, and } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

// ===========================================================================
// HELPERS D'AUTH
// ===========================================================================

async function getSessionContext() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  return { userId: session.user.id, clubId, roles }
}

async function requireManagerAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, ['admin', 'manager'])
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  return { userId: session.user.id, clubId, roles }
}

// ===========================================================================
// TYPES
// ===========================================================================

export type MatchStats = {
  goals?: number
  assists?: number
  minutesPlayed?: number
  rating?: number
}

export type SheetPlayer = {
  userId: string
  name: string | null
  isStarter: boolean | null
  convocationId: string
  present: boolean | null   // null = pas encore marqué
  stats: MatchStats | null
}

export type SheetData = {
  event: {
    id: string
    title: string
    type: string
    date: Date
    location: string | null
    teamName: string | null
  }
  players: SheetPlayer[]
}

// ===========================================================================
// LECTURE
// ===========================================================================

// ---------------------------------------------------------------------------
// listMatchSheetData — données pour la page Manager
// ---------------------------------------------------------------------------
export async function listMatchSheetData(eventId: string): Promise<SheetData | null> {
  const { clubId, userId, roles } = await requireManagerAuth()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    with: { team: { columns: { id: true, name: true } } },
  })
  if (!event) return null

  // Non-admin : vérifier que l'utilisateur gère l'équipe de cet événement
  if (!roles.includes('admin')) {
    if (!event.teamId || !(await isManagerOfTeam(userId, event.teamId))) return null
  }

  // Récupérer convocations + présences + performances en parallèle
  const [convocationList, presenceList, performanceList] = await Promise.all([
    db.query.convocations.findMany({
      where: eq(convocations.eventId, eventId),
      with: { user: { columns: { id: true, name: true } } },
      orderBy: (c, { asc }) => [asc(c.createdAt)],
    }),
    db.query.presences.findMany({
      where: eq(presences.eventId, eventId),
      columns: { userId: true, present: true },
    }),
    db.query.performances.findMany({
      where: eq(performances.eventId, eventId),
      columns: { userId: true, stats: true },
    }),
  ])

  const presenceMap = new Map(presenceList.map((p) => [p.userId, p.present]))
  const performanceMap = new Map(
    performanceList.map((p) => [p.userId, p.stats as MatchStats]),
  )

  const players: SheetPlayer[] = convocationList.map((conv) => ({
    userId: conv.user.id,
    name: conv.user.name,
    isStarter: conv.isStarter,
    convocationId: conv.id,
    present: presenceMap.has(conv.user.id) ? presenceMap.get(conv.user.id)! : null,
    stats: performanceMap.get(conv.user.id) ?? null,
  }))

  return {
    event: {
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      teamName: event.team?.name ?? null,
    },
    players,
  }
}

// ---------------------------------------------------------------------------
// getMatchSheetUserView — lecture pour la page User
// ---------------------------------------------------------------------------
export async function getMatchSheetUserView(eventId: string): Promise<SheetData | null> {
  const { clubId } = await getSessionContext()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    with: { team: { columns: { id: true, name: true } } },
  })
  if (!event) return null

  const [convocationList, presenceList, performanceList] = await Promise.all([
    db.query.convocations.findMany({
      where: eq(convocations.eventId, eventId),
      with: { user: { columns: { id: true, name: true } } },
      orderBy: (c, { asc }) => [asc(c.createdAt)],
    }),
    db.query.presences.findMany({
      where: eq(presences.eventId, eventId),
      columns: { userId: true, present: true },
    }),
    db.query.performances.findMany({
      where: eq(performances.eventId, eventId),
      columns: { userId: true, stats: true },
    }),
  ])

  const presenceMap = new Map(presenceList.map((p) => [p.userId, p.present]))
  const performanceMap = new Map(
    performanceList.map((p) => [p.userId, p.stats as MatchStats]),
  )

  const players: SheetPlayer[] = convocationList.map((conv) => ({
    userId: conv.user.id,
    name: conv.user.name,
    isStarter: conv.isStarter,
    convocationId: conv.id,
    present: presenceMap.has(conv.user.id) ? presenceMap.get(conv.user.id)! : null,
    stats: performanceMap.get(conv.user.id) ?? null,
  }))

  return {
    event: {
      id: event.id,
      title: event.title,
      type: event.type,
      date: event.date,
      location: event.location,
      teamName: event.team?.name ?? null,
    },
    players,
  }
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// saveMatchSheet — sauvegarde présences + performances
// Appelé via saveMatchSheet.bind(null, eventId) dans le composant client
// ---------------------------------------------------------------------------
export async function saveMatchSheet(
  eventId: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { clubId, userId, roles } = await requireManagerAuth()

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clubId, clubId)),
    columns: { id: true, type: true, teamId: true },
  })
  if (!event) return { success: false, error: 'Événement introuvable' }
  if (!roles.includes('admin')) {
    if (!event.teamId || !(await isManagerOfTeam(userId, event.teamId))) {
      return { success: false, error: 'Accès refusé' }
    }
  }

  // Récupérer la liste des joueurs convoqués depuis la DB (source de vérité)
  const convocationList = await db.query.convocations.findMany({
    where: eq(convocations.eventId, eventId),
    columns: { userId: true },
  })
  const playerIds = convocationList.map((c) => c.userId)

  if (playerIds.length === 0) {
    return { success: false, error: 'Aucun joueur convoqué pour cet événement' }
  }

  // Construire les données de présence
  const presenceValues = playerIds.map((uid) => ({
    id: crypto.randomUUID(),
    eventId,
    userId: uid,
    present: formData.get(`present_${uid}`) === 'on',
  }))

  // Supprimer les données existantes et réinsérer (approche simple et fiable)
  await db.delete(presences).where(eq(presences.eventId, eventId))
  if (presenceValues.length > 0) {
    await db.insert(presences).values(presenceValues)
  }

  // Performances (uniquement pour les matchs)
  if (event.type === 'match') {
    const presentIds = presenceValues
      .filter((p) => p.present)
      .map((p) => p.userId)

    const performanceValues = presentIds.map((uid) => {
      const goals         = Math.max(0, parseInt((formData.get(`goals_${uid}`)    as string) || '0') || 0)
      const assists       = Math.max(0, parseInt((formData.get(`assists_${uid}`)  as string) || '0') || 0)
      const minutesPlayed = Math.max(0, parseInt((formData.get(`minutes_${uid}`)  as string) || '0') || 0)
      const rawRating     = parseFloat((formData.get(`rating_${uid}`) as string) || '0') || 0
      const rating        = Math.min(10, Math.max(0, rawRating))

      return {
        id: crypto.randomUUID(),
        eventId,
        userId: uid,
        stats: { goals, assists, minutesPlayed, rating } satisfies MatchStats,
      }
    })

    await db.delete(performances).where(eq(performances.eventId, eventId))
    if (performanceValues.length > 0) {
      await db.insert(performances).values(performanceValues)
    }
  }

  revalidatePath(`/dashboard/match-sheet/${eventId}`)
  revalidatePath(`/dashboard/manager/match-sheet/${eventId}`)
  return { success: true, data: undefined }
}
