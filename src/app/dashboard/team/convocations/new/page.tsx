import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { checkRole } from '@/lib/check-role'
import { listEligibleEvents, listAvailablePlayers } from '@/app/dashboard/convocations/actions'
import { EventSelect } from '@/app/dashboard/team/convocations/_components/EventSelect'
import { PlayerSelectForm } from '@/app/dashboard/team/convocations/_components/PlayerSelectForm'

type Props = {
  searchParams: Promise<{ eventId?: string }>
}

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Autre',
}

export default async function NewConvocationPage({ searchParams }: Props) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  const ok = await checkRole(session.user.id, ['admin', 'manager'])
  if (!ok) redirect('/dashboard/team/convocations')

  const { eventId } = await searchParams

  const eligibleEvents = await listEligibleEvents()

  // Données de l'événement sélectionné
  const selectedEvent = eventId
    ? eligibleEvents.find((e) => e.id === eventId) ?? null
    : null

  const availablePlayers = eventId ? await listAvailablePlayers(eventId) : []

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/team/convocations"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux convocations
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouvelle convocation
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Sélectionnez un événement puis les joueurs à convoquer.
        </p>
      </div>

      <div
        className="rounded-xl p-6 space-y-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        {/* Sélection de l'événement */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: '#353148' }}>
            Événement
          </label>
          {eligibleEvents.length === 0 ? (
            <p className="text-sm" style={{ color: '#8e8a9c' }}>
              Aucun événement à venir pour vos équipes.
            </p>
          ) : (
            <EventSelect events={eligibleEvents} currentEventId={eventId} />
          )}
        </div>

        {/* Infos de l'événement sélectionné */}
        {selectedEvent && (
          <div className="rounded-lg px-4 py-3" style={{ backgroundColor: '#f3f0ff' }}>
            <p className="text-sm font-semibold" style={{ color: '#353148' }}>
              {TYPE_LABELS[selectedEvent.type] ?? selectedEvent.type} — {selectedEvent.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
              {new Date(selectedEvent.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              à{' '}
              {new Date(selectedEvent.date).toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {selectedEvent.location && ` · ${selectedEvent.location}`}
            </p>
            {selectedEvent.team && (
              <p className="text-xs mt-0.5" style={{ color: '#8c60f3' }}>
                {selectedEvent.team.name}
              </p>
            )}
          </div>
        )}

        {/* Sélection des joueurs */}
        {eventId && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: '#353148' }}>
                Joueurs disponibles
              </label>
              {availablePlayers.length > 0 && (
                <span className="text-xs" style={{ color: '#8e8a9c' }}>
                  {availablePlayers.length} joueur{availablePlayers.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <PlayerSelectForm eventId={eventId} players={availablePlayers} />
          </div>
        )}
      </div>
    </div>
  )
}
