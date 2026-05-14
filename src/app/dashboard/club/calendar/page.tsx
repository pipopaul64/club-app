import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { listEvents, listAccessibleTeams } from '@/app/dashboard/events/actions'
import { TeamFilter } from '@/app/dashboard/events/_components/TeamFilter'
import { TypeFilter } from '@/app/dashboard/events/_components/TypeFilter'

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

type Props = {
  searchParams: Promise<{
    teamId?: string
    type?:   string
  }>
}

export default async function ClubCalendarPage({ searchParams }: Props) {
  const { teamId, type } = await searchParams

  // Auth
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  // Plage : 60 j passés → +1 an
  const since = new Date(); since.setDate(since.getDate() - 60)
  const until = new Date(); until.setFullYear(until.getFullYear() + 1)

  // Données en parallèle. listEvents applique la visibilité par rôle :
  //  - admin  → tous les événements du club
  //  - manager → équipes gérées + événements club-wide
  //  - user   → équipes où je joue + événements club-wide
  const [allEvents, teams] = await Promise.all([
    listEvents({ dateRange: { start: since, end: until }, teamId, type }),
    listAccessibleTeams(),
  ])

  const now      = new Date()
  const upcoming = allEvents.filter((e) => new Date(e.date) >= now)
  const past     = allEvents.filter((e) => new Date(e.date) <  now)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Calendrier</h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Événements de votre club, toutes équipes confondues (60 jours passés + à venir)
        </p>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        {teams.length > 1 && (
          <Suspense>
            <TeamFilter teams={teams} currentTeamId={teamId} />
          </Suspense>
        )}
        <Suspense>
          <TypeFilter currentType={type} />
        </Suspense>
      </div>

      {/* Contenu */}
      <div className="space-y-8">
        {allEvents.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
          >
            <p className="text-2xl mb-2">📅</p>
            <p className="text-sm font-medium" style={{ color: '#353148' }}>
              Aucun événement
            </p>
            <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
              Les événements des 60 derniers jours et à venir apparaîtront ici.
            </p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <Section title={`À venir (${upcoming.length})`} events={upcoming} />
            )}
            {past.length > 0 && (
              <Section title={`Passés — 60 derniers jours (${past.length})`} events={past} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

type Event = Awaited<ReturnType<typeof listEvents>>[number]

function Section({ title, events }: { title: string; events: Event[] }) {
  return (
    <section>
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
    </section>
  )
}

function EventRow({ event }: { event: Event }) {
  const badge = TYPE_COLORS[event.type] ?? TYPE_COLORS.other
  const label = TYPE_LABELS[event.type] ?? event.type
  const isPast = new Date(event.date) < new Date()

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-center gap-3"
      style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e4e0ec',
        opacity: isPast ? 0.85 : 1,
      }}
    >
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: badge.bg, color: badge.color }}
      >
        {label}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: '#353148' }}>
          {event.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
          {dateStr} · {timeStr}
          {event.team && <span> · {event.team.name}</span>}
          {event.location && <span> · 📍 {event.location}</span>}
        </p>
      </div>
    </div>
  )
}
