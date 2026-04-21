import Link from 'next/link'
import { notFound } from 'next/navigation'
import { listMatchSheetData } from '@/app/dashboard/match-sheet/actions'
import { PresenceMatchForm } from './_components/PresenceMatchForm'

type Props = {
  params: Promise<{ eventId: string }>
}

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Autre',
}

export default async function ManagerMatchSheetPage({ params }: Props) {
  const { eventId } = await params
  const data = await listMatchSheetData(eventId)
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

  const presentCount = players.filter((p) => p.present === true).length
  const absentCount  = players.filter((p) => p.present === false).length

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/manager/convocations/${eventId}`}
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Convocation
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
        <div>
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

        {/* Stats résumé */}
        {players.length > 0 && (players.some((p) => p.present !== null)) && (
          <div
            className="flex items-center gap-4 mt-3 pt-3"
            style={{ borderTop: '1px solid #d4c8f8' }}
          >
            <span className="text-xs" style={{ color: '#166534' }}>
              ✓ {presentCount} présent{presentCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs" style={{ color: '#991b1b' }}>
              ✗ {absentCount} absent{absentCount > 1 ? 's' : ''}
            </span>
            <span className="text-xs ml-auto" style={{ color: '#8e8a9c' }}>
              {players.length} convoqué{players.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Contenu principal */}
      {players.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Aucun joueur convoqué pour cet événement.
          </p>
          <Link
            href={`/dashboard/manager/convocations/new?eventId=${eventId}`}
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Convoquer des joueurs →
          </Link>
        </div>
      ) : (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#353148' }}>
              {isMatch ? 'Présences & performances' : 'Présences'}
            </h3>
            {isMatch && (
              <span className="text-xs" style={{ color: '#8e8a9c' }}>
                Buts · Passes · Minutes · Note
              </span>
            )}
          </div>

          <PresenceMatchForm
            eventId={eventId}
            players={players}
            isMatch={isMatch}
          />
        </div>
      )}
    </div>
  )
}
