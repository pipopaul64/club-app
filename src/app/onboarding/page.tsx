import { redirect } from 'next/navigation'
import { completeOnboarding, getOnboardingContext } from './actions'
import { OnboardingForm } from './_components/OnboardingForm'

export default async function OnboardingPage() {
  let ctx
  try {
    ctx = await getOnboardingContext()
  } catch {
    redirect('/login')
  }

  // Si l'utilisateur n'a pas de club, on ne peut pas continuer.
  // Cas anormal — possiblement un compte créé hors invitation.
  if (ctx.availableTeams.length === 0) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#f8f6fc' }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <h1 className="text-xl font-bold mb-2" style={{ color: '#353148' }}>
            Aucune équipe disponible
          </h1>
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Votre club n&apos;a pas encore créé d&apos;équipe. Contactez un
            administrateur pour qu&apos;il en ajoute, puis revenez sur cette page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 py-10"
      style={{ backgroundColor: '#f8f6fc' }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl p-8"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#8c60f3' }}>
            ClubOS · Onboarding
          </p>
          <h1 className="text-2xl font-bold mt-2" style={{ color: '#353148' }}>
            {ctx.alreadyCompleted ? 'Mes équipes & profil' : 'Encore une étape !'}
          </h1>
          <p className="text-sm mt-2" style={{ color: '#8e8a9c' }}>
            {ctx.isManager
              ? 'Choisissez les équipes que vous gérez (et celles où vous jouez si vous êtes aussi joueur).'
              : 'Choisissez la ou les équipes auxquelles vous appartenez.'}
          </p>
        </div>

        <OnboardingForm
          action={completeOnboarding}
          isManager={ctx.isManager}
          availableTeams={ctx.availableTeams}
          defaultMemberTeamIds={ctx.currentMemberTeamIds}
          defaultManagerTeamIds={ctx.currentManagerTeamIds}
        />
      </div>
    </div>
  )
}
