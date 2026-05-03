import Link from 'next/link'
import { listAdminEvents } from '@/app/dashboard/events/actions'
import { DeleteEventButton } from './_components/DeleteEventButton'

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Événement',
}

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  match:    { bg: '#fef3c7', color: '#92400e' },
  training: { bg: '#dbeafe', color: '#1e40af' },
  other:    { bg: '#f3f0ff', color: '#6d28d9' },
}

export default async function AdminEventsPage() {
  const allEvents = await listAdminEvents()

  const now      = new Date()
  const upcoming = allEvents.filter((e) => new Date(e.date) >= now)
  const past     = allEvents.filter((e) => new Date(e.date) < now)

  return (
    <div>
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e0ec' }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#353148' }}>Événements</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
            Tous les événements du club
          </p>
        </div>
        <Link
          href="/dashboard/admin/events/new"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouvel événement
        </Link>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8 max-w-4xl">
        {allEvents.length === 0 && (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
          >
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm font-medium" style={{ color: '#353148' }}>
              Aucun événement pour l&apos;instant
            </p>
            <p className="text-xs mt-1 mb-4" style={{ color: '#8e8a9c' }}>
              Les événements des 60 derniers jours et à venir apparaîtront ici.
            </p>
            <Link
              href="/dashboard/admin/events/new"
              className="inline-block px-4 py-2 text-sm font-medium rounded-lg text-white"
              style={{ backgroundColor: '#8c60f3' }}
            >
              Créer un événement
            </Link>
          </div>
        )}

        {upcoming.length > 0 && <Section title="À venir" events={upcoming} />}
        {past.length > 0     && <Section title="Passés — 60 derniers jours" events={past} />}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

type Event = Awaited<ReturnType<typeof listAdminEvents>>[number]

function Section({ title, events }: { title: string; events: Event[] }) {
  return (
    <div>
      <h2
        className="text-xs font-semibold uppercase tracking-wide mb-3"
        style={{ color: '#8e8a9c' }}
      >
        {title}
      </h2>
      <div className="space-y-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: Event }) {
  const badge = TYPE_COLORS[event.type] ?? TYPE_COLORS.other
  const label = TYPE_LABELS[event.type] ?? event.type

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
    >
      {/* Badge */}
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {label}
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#353148' }}>
          {event.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
          {dateStr} · {timeStr}
          {event.team && <span> · {event.team.name}</span>}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 flex-shrink-0">
        <Link
          href={`/dashboard/admin/events/${event.id}/edit`}
          className="text-xs font-medium hover:underline"
          style={{ color: '#8c60f3' }}
        >
          Modifier
        </Link>
        <DeleteEventButton eventId={event.id} />
      </div>
    </div>
  )
}
