import { notFound } from 'next/navigation'
import { getInviteContext, redeemInvite } from './actions'
import { RedeemForm } from './_components/RedeemForm'

type Props = { params: Promise<{ token: string }> }

const ROLE_LABELS: Record<string, string> = {
  user:    'licencié',
  manager: 'manager',
}

export default async function InviteRedeemPage({ params }: Props) {
  const { token } = await params
  const ctx = await getInviteContext(token)
  if (!ctx) notFound()

  const action = redeemInvite.bind(null, token)

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: '#f8f6fc' }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8c60f3' }}>
            ClubOS · Invitation
          </p>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#353148' }}>
            Bienvenue dans {ctx.clubName} !
          </h1>
          <p className="text-sm mt-2" style={{ color: '#8e8a9c' }}>
            Vous êtes invité(e) en tant que <strong>{ROLE_LABELS[ctx.invitedRole] ?? ctx.invitedRole}</strong>.
            Créez votre compte pour continuer — vous pourrez choisir vos équipes
            à l&apos;étape suivante.
          </p>
        </div>

        <RedeemForm action={action} email={ctx.email} />

        <p className="text-xs mt-6" style={{ color: '#b0acbc' }}>
          Ce lien est personnel et à usage unique.
        </p>
      </div>
    </div>
  )
}
