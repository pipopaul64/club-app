import Link from 'next/link'
import { listManagerEventsSummary } from '@/app/dashboard/convocations/actions'
import type { EventType } from '@/db/schema'

const TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string; bg: string }> = {
  match:    { label: 'Match',          icon: '⚽', color: '#c0392b', bg: '#fdf0f0' },
  training: { label: 'Entraînement',   icon: '🏃', color: '#2563eb', bg: '#eff6ff' },
  other:    { label: 'Autre',          icon: '📌', color: '#6d28d9', bg: '#ede9fe' },
}

export default async function ManagerConvocationsPage() {
  const allEvents = await listManagerEventsSummary()

  const now = new Date()
  const upcoming = allEvents.filter((e) => new Date(e.date) >= now)
  const past     = allEvents.filter((e) => new Date(e.date) <  now)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Convocations</h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            Gérez les convocations et feuilles de match de vos équipes
          </p>
        </div>
        <Link
          href="/dashboard/manager/convocations/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouvelle
        </Link>
      </div>

      {/* Aucun événement */}
      {allEvents.length === 0 && (
        <div
          className="rounded-xl p-12 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm font-medium" style={{ color: '#353148' }}>
            Aucun événement sur les 60 derniers jours
          </p>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            Créez d&apos;abord un événement via le calendrier.
          </p>
          <Link
            href="/dashboard/manager/events/new"
            className="mt-4 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Créer un événement →
          </Link>
        </div>
      )}

      {/* À venir */}
      {upcoming.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#8e8a9c' }}
          >
            À venir ({upcoming.length})
          </h2>
          <div className="space-y-2">
            {upcoming.map((event) => (
              <EventRow key={event.id} event={event} isPast={false} />
            ))}
          </div>
        </section>
      )}

      {/* Passés */}
      {past.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: '#8e8a9c' }}
          >
            Passés — 60 derniers jours ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map((event) => (
              <EventRow key={event.id} event={event} isPast />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// EventRow
// ---------------------------------------------------------------------------

type EventSummary = {
  id: string
  title: string
  type: string
  date: Date
  location: string | null
  team: { id: string; name: string } | null
  convocations: { id: string }[]
}

function EventRow({ event, isPast }: { event: EventSummary; isPast: boolean }) {
  const cfg  = TYPE_CONFIG[event.type as EventType] ?? TYPE_CONFIG.other
  const convCount = event.convocations.length

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="rounded-xl p-4 flex items-center gap-4"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e0ec',
        opacity: isPast ? 0.8 : 1,
      }}
    >
      {/* Type badge */}
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: cfg.color, backgroundColor: cfg.bg }}
      >
        {cfg.icon} {cfg.label}
      </span>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#353148' }}>
          {event.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
          {dateStr} à {timeStr}
          {event.location && ` · ${event.location}`}
          {event.team && (
            <span style={{ color: '#8c60f3' }}> · {event.team.name}</span>
          )}
        </p>
      </div>

      {/* Convocations count */}
      <span className="text-xs flex-shrink-0" style={{ color: '#8e8a9c' }}>
        {convCount > 0
          ? `${convCount} convoqué${convCount > 1 ? 's' : ''}`
          : 'Pas encore convoqué'}
      </span>

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isPast && (
          <Link
            href={`/dashboard/manager/convocations/new?eventId=${event.id}`}
            className="text-xs px-2 py-1 rounded-lg font-medium"
            style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
          >
            {convCount > 0 ? '+ Ajouter' : 'Convoquer'}
          </Link>
        )}
        {convCount > 0 && (
          <Link
            href={`/dashboard/manager/convocations/${event.id}`}
            className="text-xs px-2 py-1 rounded-lg font-medium"
            style={{ color: '#353148', backgroundColor: '#f8f6fc' }}
          >
            {isPast ? '📋 Feuille' : 'Voir'}
          </Link>
        )}
      </div>
    </div>
  )
}
