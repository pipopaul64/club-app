/**
 * Envoi d'email d'invitation via Resend.
 *
 * Fire-and-forget côté Server Action — on log l'erreur mais on ne fait pas
 * échouer la création de l'invitation (l'admin peut toujours partager le lien
 * manuellement depuis la liste).
 */

type SendInvitationParams = {
  to: string
  clubName: string
  inviterName: string
  inviteUrl: string
  invitedRole: 'user' | 'manager'
}

const ROLE_LABEL: Record<'user' | 'manager', string> = {
  user:    'licencié',
  manager: 'manager',
}

export async function sendInvitationEmail(params: SendInvitationParams): Promise<void> {
  if (!process.env.RESEND_API_KEY) return // dev sans Resend → no-op silencieux

  const { to, clubName, inviterName, inviteUrl, invitedRole } = params
  const roleLabel = ROLE_LABEL[invitedRole]

  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from:    'ClubOS <onboarding@resend.dev>',
    to,
    subject: `[ClubOS] ${inviterName} vous invite à rejoindre ${clubName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
        <h2 style="color:#353148;margin-bottom:4px">Bienvenue ! 👋</h2>
        <p style="color:#353148">
          ${inviterName} vous invite à rejoindre <strong>${clubName}</strong>
          en tant que <strong>${roleLabel}</strong>.
        </p>
        <p style="color:#353148">
          Cliquez sur le bouton ci-dessous pour créer votre compte et choisir
          vos équipes :
        </p>
        <p style="margin:24px 0">
          <a
            href="${inviteUrl}"
            style="display:inline-block;padding:12px 24px;background:#8c60f3;color:#fff;text-decoration:none;border-radius:6px;font-weight:500"
          >
            Rejoindre ${clubName}
          </a>
        </p>
        <p style="color:#8e8a9c;font-size:13px">
          Ce lien est personnel et à usage unique. Si vous n'attendiez pas
          cette invitation, vous pouvez l'ignorer.
        </p>
      </div>
    `,
  })
}
