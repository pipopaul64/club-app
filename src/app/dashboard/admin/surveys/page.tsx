import Link from 'next/link'
import { listSurveysAdmin } from '@/app/dashboard/surveys/actions'
import { DeleteSurveyButton } from './_components/DeleteSurveyButton'

export default async function AdminSurveysPage() {
  const surveyList = await listSurveysAdmin()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
            Sondages
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {surveyList.length} sondage{surveyList.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/admin/surveys/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouveau
        </Link>
      </div>

      {/* Vide */}
      {surveyList.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ border: '1px solid #e4e0ec' }}>
          <p className="text-sm" style={{ color: '#8e8a9c' }}>Aucun sondage pour le moment.</p>
          <Link
            href="/dashboard/admin/surveys/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Créer un sondage →
          </Link>
        </div>
      )}

      {/* Liste */}
      {surveyList.length > 0 && (
        <div className="space-y-4">
          {surveyList.map((survey) => {
            const dateStr = new Date(survey.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })

            const yesCount = survey.responses.filter(
              (r) => (r.answer as { value: string })?.value === 'yes'
            ).length
            const noCount = survey.responses.filter(
              (r) => (r.answer as { value: string })?.value === 'no'
            ).length
            const totalResponses = survey.responses.length

            return (
              <div
                key={survey.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
              >
                {/* Question */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold" style={{ color: '#353148' }}>
                      {survey.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
                      Créé le {dateStr}
                    </p>
                  </div>
                  <DeleteSurveyButton surveyId={survey.id} />
                </div>

                {/* Résultats */}
                {totalResponses > 0 ? (
                  <div
                    className="mt-4 pt-3"
                    style={{ borderTop: '1px solid #f0eef8' }}
                  >
                    <p className="text-xs font-medium mb-2" style={{ color: '#8e8a9c' }}>
                      {totalResponses} réponse{totalResponses > 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: '#166534' }}>
                          ✓ Oui : {yesCount}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold" style={{ color: '#991b1b' }}>
                          ✗ Non : {noCount}
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression */}
                    {totalResponses > 0 && (
                      <div
                        className="h-2 rounded-full overflow-hidden"
                        style={{ backgroundColor: '#fee2e2' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width:           `${(yesCount / totalResponses) * 100}%`,
                            backgroundColor: '#22c55e',
                          }}
                        />
                      </div>
                    )}

                    {/* Liste des répondants */}
                    <details className="mt-3">
                      <summary
                        className="text-xs cursor-pointer hover:underline"
                        style={{ color: '#8c60f3' }}
                      >
                        Voir les réponses individuelles
                      </summary>
                      <div className="mt-2 space-y-1">
                        {survey.responses.map((r) => {
                          const answer = (r.answer as { value: string })?.value
                          return (
                            <div
                              key={r.id}
                              className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg"
                              style={{ backgroundColor: '#fafafa' }}
                            >
                              <span style={{ color: '#353148' }}>{r.user.name}</span>
                              <span
                                style={{
                                  color: answer === 'yes' ? '#166534' : '#991b1b',
                                  fontWeight: 600,
                                }}
                              >
                                {answer === 'yes' ? 'Oui' : 'Non'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </details>
                  </div>
                ) : (
                  <p className="text-xs mt-3 pt-3" style={{ borderTop: '1px solid #f0eef8', color: '#b0acbc' }}>
                    Aucune réponse pour le moment
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
