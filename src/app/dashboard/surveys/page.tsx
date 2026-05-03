import Link from 'next/link'
import { listSurveysForUser } from './actions'
import { SurveyResponseButtons } from './_components/SurveyResponseButtons'

export default async function SurveysPage() {
  const surveyList = await listSurveysForUser()

  const pending   = surveyList.filter((s) => !s.hasResponded)
  const responded = surveyList.filter((s) => s.hasResponded)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/calendar"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Calendrier
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Sondages
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Répondez aux sondages de votre club
        </p>
      </div>

      {/* Aucun sondage */}
      {surveyList.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Aucun sondage pour le moment.
          </p>
        </div>
      )}

      {/* Sondages en attente de réponse */}
      {pending.length > 0 && (
        <section className="mb-8">
          <h2
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: '#8e8a9c' }}
          >
            En attente de votre réponse ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((survey) => {
              const dateStr = new Date(survey.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric',
              })
              return (
                <div
                  key={survey.id}
                  className="rounded-xl p-5"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #d4c8f8' }}
                >
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full mb-2 inline-block"
                    style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
                  >
                    📊 Sondage
                  </span>
                  <p className="text-sm font-semibold mt-1" style={{ color: '#353148' }}>
                    {survey.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
                    {dateStr}
                  </p>
                  <SurveyResponseButtons surveyId={survey.id} />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Sondages répondus */}
      {responded.length > 0 && (
        <section>
          <h2
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: '#8e8a9c' }}
          >
            Déjà répondus
          </h2>
          <div className="space-y-3">
            {responded.map((survey) => {
              const answer = survey.myAnswer?.value
              const dateStr = new Date(survey.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long',
              })
              return (
                <div
                  key={survey.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: '#fafafa', border: '1px solid #f0eef8' }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: '#8e8a9c' }}>
                      {survey.title}
                    </p>
                    <p className="text-xs" style={{ color: '#b0acbc' }}>{dateStr}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={
                        answer === 'yes'
                          ? { color: '#166534', backgroundColor: '#dcfce7' }
                          : { color: '#991b1b', backgroundColor: '#fee2e2' }
                      }
                    >
                      {answer === 'yes' ? '✓ Oui' : '✗ Non'}
                    </span>
                    <SurveyResponseButtons surveyId={survey.id} currentAnswer={answer as 'yes' | 'no'} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
