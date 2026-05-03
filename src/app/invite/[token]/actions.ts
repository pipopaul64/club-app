'use server'

import { db } from '@/db'
import { clubs, invitations, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { redeemInviteSchema } from '@/lib/validations'
import { and, eq, isNull } from 'drizzle-orm'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

// ---------------------------------------------------------------------------
// getInviteContext — public, lit le token et renvoie email + rôle + club
// ---------------------------------------------------------------------------
export type InviteContext = {
  email:       string
  invitedRole: 'user' | 'manager'
  clubName:    string
}

export async function getInviteContext(token: string): Promise<InviteContext | null> {
  const invite = await db.query.invitations.findFirst({
    where: and(eq(invitations.token, token), isNull(invitations.usedAt)),
    columns: { email: true, invitedRole: true, clubId: true },
  })
  if (!invite) return null

  const club = await db.query.clubs.findFirst({
    where: eq(clubs.id, invite.clubId),
    columns: { name: true },
  })

  return {
    email:       invite.email,
    invitedRole: invite.invitedRole,
    clubName:    club?.name ?? 'le club',
  }
}

// ---------------------------------------------------------------------------
// redeemInvite — création du compte Better-Auth + assignation clubId/roles
// L'email vient de l'invitation (pas du form) pour empêcher l'usurpation.
// ---------------------------------------------------------------------------
export async function redeemInvite(
  token: string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = redeemInviteSchema.safeParse({
    name:     formData.get('name'),
    password: formData.get('password'),
  })
  if (!parsed.success) {
    return { success: false, error: parsed.error.errors[0].message }
  }

  const invite = await db.query.invitations.findFirst({
    where: and(eq(invitations.token, token), isNull(invitations.usedAt)),
    columns: { id: true, clubId: true, email: true, invitedRole: true },
  })
  if (!invite) {
    return { success: false, error: 'Lien d\'invitation invalide ou déjà utilisé' }
  }

  // Refus si un licencié existe déjà avec cet email dans ce club
  // (cas anormal : invitation pas marquée used mais user créé via autre voie)
  const existing = await db.query.users.findFirst({
    where: and(
      eq(users.email, invite.email),
      eq(users.clubId, invite.clubId),
      isNull(users.deletedAt),
    ),
    columns: { id: true },
  })
  if (existing) {
    return { success: false, error: 'Un compte existe déjà avec cet email' }
  }

  // 1. Création du compte via Better-Auth (gère le hashing + cookie de session)
  const signUp = await auth.api.signUpEmail({
    body: {
      email:    invite.email,
      password: parsed.data.password,
      name:     parsed.data.name,
    },
  })
  if (!signUp?.user?.id) {
    const msg = (signUp as unknown as { error?: { message?: string } })?.error?.message
    return { success: false, error: msg ?? 'Échec de la création du compte' }
  }

  // 2. Lier au club + rôles. 'user' implicite + le rôle invité.
  const grantedRoles: UserRole[] =
    invite.invitedRole === 'manager' ? ['user', 'manager'] : ['user']

  await db.update(users)
    .set({
      clubId: invite.clubId,
      roles:  grantedRoles,
      // onboardingCompletedAt reste null → le layout dashboard redirige vers /onboarding
    })
    .where(eq(users.id, signUp.user.id))

  // 3. Marquer l'invitation comme utilisée
  await db.update(invitations)
    .set({ usedAt: new Date() })
    .where(eq(invitations.id, invite.id))

  // Better-Auth a posé le cookie de session via signUpEmail → l'utilisateur
  // est connecté. Le client redirige vers /onboarding.
  return { success: true, data: undefined }
}
