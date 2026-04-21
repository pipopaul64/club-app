import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMatchSheetUserView } from '@/app/dashboard/match-sheet/actions'

type Props = {
  params: Promise<{ eventId: string }>
}

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Autre',
}

export default async function MatchSheetUserPage({ params }: Props) {
  const { eventId } = await params
  const data = await getMatchSheetUserView(eventId)
  if (!data) notFound()

  const { event, players } = data
  const isMatch = event.type === 'match'

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const presentPlayers = players.filter((p) => p.present === true)
  const absentPlayers  = players.filter((p) => p.present === false)
  const unknownPlayers = players.filter((p) => p.present === null)
  const hasPresenceData = players.some((p) => p.present !== null)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/convocations"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Mes convocations
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Feuille de {isMatch ? 'match' : 'présence'}
        </h1>
      </div>

      {/* Infos événement */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#f3f0ff', border: '1px solid #d4c8f8' }}
      >
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full mb-1 inline-block"
          style={{ color: '#8c60f3', backgroundColor: '#e9e2fd' }}
        >
          {TYPE_LABELS[event.type] ?? event.type}
        </span>
        <h2 className="text-lg font-bold" style={{ color: '#353148' }}>
          {event.title}
        </h2>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          📅 {dateStr} à {timeStr}
        </p>
        {event.location && (
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            📍 {event.location}
          </p>
        )}
        {event.teamName && (
          <p className="text-sm font-medium mt-1" style={{ color: '#8c60f3' }}>
            {event.teamName}
          </p>
        )}
      </div>

      {/* Feuille non encore remplie */}
      {!hasPresenceData && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            La feuille de {isMatch ? 'match' : 'présence'} n&apos;a pas encore été remplie.
          </p>
        </div>
      )}

      {/* Joueurs présents */}
      {hasPresenceData && presentPlayers.length > 0 && (
        <section>
          <h2
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: '#166534' }}
          >
            ✓ Présents ({presentPlayers.length})
          </h2>
          <div className="space-y-2">
            {presentPlayers.map((player) => {
              const posLabel =
                player.isStarter === true
                  ? '👕 Titulaire'
                  : player.isStarter === false
                  ? '🔄 Remplaçant'
                  : null

              return (
                <div
                  key={player.userId}
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid #e4e0ec', backgroundColor: '#fff' }}
                >
                  {/* Nom + position */}
                  <div className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#353148' }}>
                        {player.name}
                      </p>
                      {posLabel && (
                        <span className="text-xs" style={{ color: '#8c60f3' }}>
                          {posLabel}
                        </span>
                      )}
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ color: '#166534', backgroundColor: '#dcfce7' }}
                    >
                      Présent
                    </span>
                  </div>

                  {/* Stats match */}
                  {isMatch && player.stats && (
                    <div
                      className="px-4 pb-3 pt-2 flex flex-wrap gap-4"
                      style={{ borderTop: '1px solid #f0eef8', backgroundColor: '#fafafa' }}
                    >
                      {(player.stats.goals ?? 0) > 0 && (
                        <span className="text-xs" style={{ color: '#353148' }}>
                          ⚽ <strong>{player.stats.goals}</strong> but{(player.stats.goals ?? 0) > 1 ? 's' : ''}
                        </span>
                      )}
                      {(player.stats.assists ?? 0) > 0 && (
                        <span className="text-xs" style={{ color: '#353148' }}>
                          🎯 <strong>{player.stats.assists}</strong> passe{(player.stats.assists ?? 0) > 1 ? 's' : ''}
                        </span>
                      )}
                      {(player.stats.minutesPlayed ?? 0) > 0 && (
                        <span className="text-xs" style={{ color: '#353148' }}>
                          ⏱ <strong>{player.stats.minutesPlayed}</strong> min
                        </span>
                      )}
                      {(player.stats.rating ?? 0) > 0 && (
                        <span className="text-xs" style={{ color: '#353148' }}>
                          ⭐ <strong>{player.stats.rating}</strong>/10
                        </span>
                      )}
                      {(player.stats.goals ?? 0) === 0 &&
                        (player.stats.assists ?? 0) === 0 &&
                        (player.stats.minutesPlayed ?? 0) === 0 &&
                        (player.stats.rating ?? 0) === 0 && (
                          <span className="text-xs" style={{ color: '#8e8a9c' }}>
                            Aucune statistique enregistrée
                          </span>
                        )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Joueurs absents */}
      {hasPresenceData && absentPlayers.length > 0 && (
        <section>
          <h2
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: '#991b1b' }}
          >
            ✗ Absents ({absentPlayers.length})
          </h2>
          <div className="space-y-2">
            {absentPlayers.map((player) => (
              <div
                key={player.userId}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  border: '1px solid #f0eef8',
                  backgroundColor: '#fafafa',
                }}
              >
                <p className="text-sm" style={{ color: '#8e8a9c' }}>
                  {player.name}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}
                >
                  Absent
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Joueurs sans info */}
      {unknownPlayers.length > 0 && (
        <section>
          <h2
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: '#8e8a9c' }}
          >
            En attente ({unknownPlayers.length})
          </h2>
          <div className="space-y-2">
            {unknownPlayers.map((player) => (
              <div
                key={player.userId}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{
                  border: '1px solid #f0eef8',
                  backgroundColor: '#fafafa',
                }}
              >
                <p className="text-sm" style={{ color: '#8e8a9c' }}>
                  {player.name}
                </p>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ color: '#92400e', backgroundColor: '#fef3c7' }}
                >
                  —
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
