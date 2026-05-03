import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { listEvents } from '@/app/dashboard/events/actions'
import { listMyTeams, pickActiveTeam } from '@/lib/my-teams'
import { TeamPicker } from '@/components/dashboard/TeamPicker'
import type { UserRole } from '@/db/schema'

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

type Props = { searchParams: Promise<{ teamId?: string }> }

export default async function TeamCalendarPage({ searchParams }: Props) {
  const { teamId: requestedTeamId } = await searchParams

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const userId = session.user.id
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) redirect('/dashboard')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]

  const myTeams    = await listMyTeams(userId, clubId, roles)
  const activeTeam = pickActiveTeam(myTeams, requestedTeamId)
  const isManager  = roles.includes('manager') || roles.includes('admin')

  // Plage : 60 j passés → +1 an
  const since = new Date(); since.setDate(since.getDate() - 60)
  const until = new Date(); until.setFullYear(until.getFullYear() + 1)

  const allEvents = activeTeam
    ? await listEvents({ teamId: activeTeam.id, dateRange: { start: since, end: until } })
    : []

  const now      = new Date()
  const upcoming = allEvents.filter((e) => new Date(e.date) >= now)
  const past     = allEvents.filter((e) => new Date(e.date) < now)

  return (
    <div>
      {/* Header */}
      <div
        className="px-8 py-5 flex items-center justify-between gap-3 flex-wrap"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e0ec' }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#353148' }}>Calendrier</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
            Événements de mon équipe (passés 60 j + à venir)
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {activeTeam && (
            <TeamPicker teams={myTeams} activeId={activeTeam.id} />
          )}
          {isManager && activeTeam && (
            <Link
              href={`/dashboard/team/calendar/new?teamId=${activeTeam.id}`}
              className="px-4 py-2 text-sm font-medium rounded-lg text-white whitespace-nowrap"
              style={{ backgroundColor: '#8c60f3' }}
            >
              + Nouvel événement
            </Link>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-8 space-y-8 max-w-4xl">
        {myTeams.length === 0 ? (
          <EmptyState
            icon="🏃"
            title="Aucune équipe pour le moment"
            description="Vous n'êtes membre ou manager d'aucune équipe. Contactez un administrateur du club."
          />
        ) : !activeTeam ? null : allEvents.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Aucun événement pour cette équipe"
            description="Les événements des 60 derniers jours et à venir apparaîtront ici."
            cta={isManager ? { href: `/dashboard/team/calendar/new?teamId=${activeTeam.id}`, label: 'Créer un événement' } : undefined}
          />
        ) : (
          <>
            {upcoming.length > 0 && <Section title="À venir" events={upcoming} isManager={isManager} />}
            {past.length > 0     && <Section title="Passés — 60 derniers jours" events={past} isManager={isManager} />}
          </>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

type Event = Awaited<ReturnType<typeof listEvents>>[number]

function Section({ title, events, isManager }: { title: string; events: Event[]; isManager: boolean }) {
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
          <EventRow key={event.id} event={event} isManager={isManager} />
        ))}
      </div>
    </div>
  )
}

function EventRow({ event, isManager }: { event: Event; isManager: boolean }) {
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
      style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
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
        </p>
      </div>

      <div className="flex items-center gap-4 flex-shrink-0">
        {isManager && !isPast && (
          <Link
            href={`/dashboard/team/convocations/new?eventId=${event.id}`}
            className="text-xs font-medium hover:underline"
            style={{ color: '#8c60f3' }}
          >
            Convoquer
          </Link>
        )}
        <Link
          href={`/dashboard/team/convocations/${event.id}`}
          className="text-xs font-medium hover:underline"
          style={{ color: '#8e8a9c' }}
        >
          Voir convocations
        </Link>
      </div>
    </div>
  )
}

function EmptyState({
  icon, title, description, cta,
}: {
  icon:        string
  title:       string
  description: string
  cta?:        { href: string; label: string }
}) {
  return (
    <div
      className="rounded-xl p-10 text-center"
      style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
    >
      <p className="text-2xl mb-2">{icon}</p>
      <p className="text-sm font-medium" style={{ color: '#353148' }}>{title}</p>
      <p className="text-xs mt-1 mb-4" style={{ color: '#8e8a9c' }}>{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="inline-block px-4 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
