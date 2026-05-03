'use server'

import { db } from '@/db'
import { clubs, invitations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { sendInvitationEmail } from '@/lib/email-invitation'
import { createInvitationSchema } from '@/lib/validations'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import type { ActionResult } from '@/types'

const REVALIDATE = '/dashboard/admin/invitations'

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  const ok = await checkRole(session.user.id, ['admin'])
  if (!ok) throw new Error('Forbidden')
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) throw new Error('No club associated with this user')
  return { userId: session.user.id, clubId, user: session.user }
}

// ---------------------------------------------------------------------------
// LECTURE
// ---------------------------------------------------------------------------
export async function listInvitations() {
  const { clubId } = await requireAdmin()

  return db.query.invitations.findMany({
    where: eq(invitations.clubId, clubId),
    orderBy: (i) => [desc(i.createdAt)],
  })
}

// ---------------------------------------------------------------------------
// CRÉATION
// ---------------------------------------------------------------------------
export async function createInvitation(
  _prevState: ActionResult<{ inviteUrl: string }>,
  formData: FormData,
): Promise<ActionResult<{ inviteUrl: string }>> {
  const { clubId, user } = await requireAdmin()

  const parsed = createInvitationSchema.safeParse({
    email:       (formData.get('email') as string | null)?.trim().toLowerCase(),
    invitedRole: formData.get('invitedRole'),
  })
  if (!parsed.success) return { success: false, error: parsed.error.errors[0].message }

  const { email, invitedRole } = parsed.data

  // Refus si un licencié existe déjà avec cet email dans le club
  const existingUser = await db.query.users.findFirst({
    where: and(
      eq(users.email, email),
      eq(users.clubId, clubId),
      isNull(users.deletedAt),
    ),
    columns: { id: true },
  })
  if (existingUser) {
    return { success: false, error: 'Un licencié avec cet email existe déjà dans ce club' }
  }

  // Refus si une invitation non utilisée existe déjà (single-use par email/club)
  const existingInvite = await db.query.invitations.findFirst({
    where: and(eq(invitations.clubId, clubId), eq(invitations.email, email)),
    columns: { id: true, usedAt: true },
  })
  if (existingInvite) {
    return {
      success: false,
      error: existingInvite.usedAt
        ? 'Cet email a déjà accepté une invitation pour ce club'
        : 'Une invitation est déjà en attente pour cet email — révoquez-la d\'abord',
    }
  }

  const token = crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '')
  await db.insert(invitations).values({
    id:    crypto.randomUUID(),
    clubId,
    email,
    invitedRole,
    token,
  })

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'
  const inviteUrl = `${baseUrl}/invite/${token}`

  // Envoi email — fire-and-forget (l'admin a déjà l'URL retournée)
  try {
    const club = await db.query.clubs.findFirst({
      where: eq(clubs.id, clubId),
      columns: { name: true },
    })
    await sendInvitationEmail({
      to:          email,
      clubName:    club?.name ?? 'votre club',
      inviterName: (user.name as string | null) ?? 'Un administrateur',
      inviteUrl,
      invitedRole,
    })
  } catch (err) {
    console.error('[invitation] sendInvitationEmail failed:', err)
  }

  revalidatePath(REVALIDATE)
  return { success: true, data: { inviteUrl } }
}

// ---------------------------------------------------------------------------
// RÉVOCATION (uniquement si pas encore utilisée)
// ---------------------------------------------------------------------------
export async function revokeInvitation(invitationId: string): Promise<ActionResult> {
  const { clubId } = await requireAdmin()

  const invite = await db.query.invitations.findFirst({
    where: and(eq(invitations.id, invitationId), eq(invitations.clubId, clubId)),
    columns: { id: true, usedAt: true },
  })
  if (!invite) return { success: false, error: 'Invitation introuvable' }
  if (invite.usedAt) {
    return { success: false, error: 'Invitation déjà utilisée — impossible de la révoquer' }
  }

  await db.delete(invitations).where(
    and(eq(invitations.id, invitationId), eq(invitations.clubId, clubId)),
  )

  revalidatePath(REVALIDATE)
  return { success: true, data: undefined }
}
