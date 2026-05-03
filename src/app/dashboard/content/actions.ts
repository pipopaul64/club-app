'use server'

import { db } from '@/db'
import { messages, teams, teamMembers, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { createMessageSchema } from '@/lib/validations'
import { eq, and, inArray, isNull, or, desc } from 'drizzle-orm'
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
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { userId: session.user.id, clubId, role }
}

async function requireManagerAuth() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, ['admin', 'manager_sportif'])
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole
  return { userId: session.user.id, clubId, role }
}

// ===========================================================================
// LECTURE
// ===========================================================================

// ---------------------------------------------------------------------------
// listMyTeamMessages — messages visibles par l'utilisateur connecté
// Messages de ses équipes + messages club-wide (teamId IS NULL)
// ---------------------------------------------------------------------------
export async function listMyTeamMessages() {
  const { userId, clubId } = await getSessionContext()

  // Équipes de l'utilisateur
  const memberships = await db.query.teamMembers.findMany({
    where: and(
      eq(teamMembers.userId, userId),
      eq(teamMembers.clubId, clubId),
    ),
    columns: { teamId: true },
  })
  const teamIds = memberships.map((m) => m.teamId)

  // Messages club-wide OU pour ses équipes
  const conditions =
    teamIds.length > 0
      ? or(isNull(messages.teamId), inArray(messages.teamId, teamIds))
      : isNull(messages.teamId)

  return db.query.messages.findMany({
    where: and(eq(messages.clubId, clubId), conditions),
    with: {
      author: { columns: { id: true, name: true } },
      team:   { columns: { id: true, name: true } },
    },
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  })
}

// ---------------------------------------------------------------------------
// listManagerMessages — messages publiés par le manager connecté
// ---------------------------------------------------------------------------
export async function listManagerMessages() {
  const { userId, clubId, role } = await requireManagerAuth()

  // Admin : tous les messages du club
  if (role === 'admin' || role === 'manager_associatif') {
    return db.query.messages.findMany({
      where: eq(messages.clubId, clubId),
      with: {
        author: { columns: { id: true, name: true } },
        team:   { columns: { id: true, name: true } },
      },
      orderBy: (m, { desc }) => [desc(m.createdAt)],
    })
  }

  // Manager sportif : uniquement ses propres messages
  return db.query.messages.findMany({
    where: and(eq(messages.clubId, clubId), eq(messages.authorId, userId)),
    with: {
      author: { columns: { id: true, name: true } },
      team:   { columns: { id: true, name: true } },
    },
    orderBy: (m, { desc }) => [desc(m.createdAt)],
  })
}

// ===========================================================================
// MUTATIONS
// ===========================================================================

// ---------------------------------------------------------------------------
// createMessage — Manager Sportif publie pour son équipe, Admin pour le club
// ---------------------------------------------------------------------------
export async function createMessage(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const { userId, clubId, role } = await requireManagerAuth()

  const rawContent = formData.get('content') as string
  const rawTeamId  = formData.get('teamId') as string | null

  const parsed = createMessageSchema.safeParse({
    content: rawContent,
    teamId:  rawTeamId || undefined,
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  let teamId: string | null = parsed.data.teamId ?? null

  // Manager sportif : doit publier pour une de ses équipes
  if (role === 'manager_sportif') {
    if (!teamId) {
      return { success: false, error: 'Sélectionnez une équipe' }
    }
    const managedTeam = await db.query.teams.findFirst({
      where: and(
        eq(teams.id, teamId),
        eq(teams.clubId, clubId),
        eq(teams.managerId, userId),
      ),
      columns: { id: true },
    })
    if (!managedTeam) {
      return { success: false, error: 'Vous ne gérez pas cette équipe' }
    }
  }

  // Admin / manager_associatif : validation que l'équipe appartient au club
  if (teamId && (role === 'admin' || role === 'manager_associatif')) {
    const team = await db.query.teams.findFirst({
      where: and(eq(teams.id, teamId), eq(teams.clubId, clubId)),
      columns: { id: true },
    })
    if (!team) {
      return { success: false, error: 'Équipe introuvable' }
    }
  }

  await db.insert(messages).values({
    id: crypto.randomUUID(),
    clubId,
    teamId: teamId ?? null,
    authorId: userId,
    content: parsed.data.content,
  })

  // Notification email (fire-and-forget)
  try {
    await sendMessageNotification({ clubId, teamId: teamId ?? null, content: parsed.data.content, authorId: userId })
  } catch {
    // Échec silencieux
  }

  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/manager/content')
  return { success: true, data: undefined }
}

// ---------------------------------------------------------------------------
// deleteMessage — supprime un message (auteur ou admin)
// ---------------------------------------------------------------------------
export async function deleteMessage(messageId: string): Promise<ActionResult> {
  const { userId, clubId, role } = await requireManagerAuth()

  const message = await db.query.messages.findFirst({
    where: and(eq(messages.id, messageId), eq(messages.clubId, clubId)),
    columns: { id: true, authorId: true },
  })
  if (!message) return { success: false, error: 'Message introuvable' }

  // Seul l'auteur ou un admin peut supprimer
  if (message.authorId !== userId && role !== 'admin') {
    return { success: false, error: 'Accès refusé' }
  }

  await db.delete(messages).where(eq(messages.id, messageId))

  revalidatePath('/dashboard/content')
  revalidatePath('/dashboard/manager/content')
  return { success: true, data: undefined }
}

// ===========================================================================
// NOTIFICATIONS
// ===========================================================================

async function sendMessageNotification(params: {
  clubId: string
  teamId: string | null
  content: string
  authorId: string
}) {
  if (!process.env.RESEND_API_KEY) return

  const { clubId, teamId, content, authorId } = params

  // Récupérer l'auteur
  const author = await db.query.users.findFirst({
    where: and(eq(users.id, authorId), isNull(users.deletedAt)),
    columns: { name: true },
  })

  // Destinataires : membres de l'équipe ou tous les licenciés du club
  let recipients: { email: string; name: string }[] = []

  if (teamId) {
    // Message d'équipe
    const members = await db
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
    recipients = members
  } else {
    // Message club-wide
    const clubUsers = await db
      .select({ email: users.email, name: users.name })
      .from(users)
      .where(and(eq(users.clubId, clubId), isNull(users.deletedAt)))
    recipients = clubUsers
  }

  // Exclure l'auteur
  recipients = recipients.filter((r) => r.email !== undefined)
  if (recipients.length === 0) return

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const preview = content.length > 150 ? content.slice(0, 150) + '…' : content
  const authorName = author?.name ?? 'Votre club'

  await Promise.allSettled(
    recipients.map(({ email, name }) =>
      resend.emails.send({
        from:    'ClubOS <onboarding@resend.dev>',
        to:      email,
        subject: `[ClubOS] Nouveau message de ${authorName}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#353148;margin-bottom:4px">Nouveau message 💬</h2>
            <p style="color:#353148">Bonjour ${name},</p>
            <p style="color:#353148">${authorName} vous a envoyé un message :</p>
            <div style="margin:16px 0;padding:16px;background:#f3f0ff;border-radius:8px;border-left:3px solid #8c60f3">
              <p style="color:#353148;margin:0;white-space:pre-wrap">${preview}</p>
            </div>
            <p style="color:#8c60f3;font-size:14px">
              Connectez-vous sur ClubOS pour lire le message complet.
            </p>
          </div>
        `,
      }),
    ),
  )
}
