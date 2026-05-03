import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { listTeamEventsSummary } from '@/app/dashboard/convocations/actions'
import { listMyTeams, pickActiveTeam } from '@/lib/my-teams'
import { TeamPicker } from '@/components/dashboard/TeamPicker'
import type { EventType, UserRole } from '@/db/schema'

const TYPE_CONFIG: Record<EventType, { label: string; icon: string; color: string; bg: string }> = {
  match:    { label: 'Match',          icon: '⚽', color: '#c0392b', bg: '#fdf0f0' },
  training: { label: 'Entraînement',   icon: '🏃', color: '#2563eb', bg: '#eff6ff' },
  other:    { label: 'Autre',          icon: '📌', color: '#6d28d9', bg: '#ede9fe' },
}

type Props = { searchParams: Promise<{ teamId?: string }> }

export default async function TeamConvocationsPage({ searchParams }: Props) {
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

  const allEvents = activeTeam ? await listTeamEventsSummary(activeTeam.id) : []
  const now = new Date()
  const upcoming = allEvents.filter((e) => new Date(e.date) >= now)
  const past     = allEvents.filter((e) => new Date(e.date) <  now)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Convocations</h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {isManager
              ? 'Gérez les convocations et feuilles de match de votre équipe'
              : 'Convocations à venir et passées de votre équipe'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {activeTeam && (
            <TeamPicker teams={myTeams} activeId={activeTeam.id} />
          )}
          {isManager && activeTeam && (
            <Link
              href={`/dashboard/team/convocations/new?teamId=${activeTeam.id}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#8c60f3' }}
            >
              + Nouvelle
            </Link>
          )}
        </div>
      </div>

      {myTeams.length === 0 ? (
        <EmptyState
          icon="🏃"
          title="Aucune équipe pour le moment"
          description="Vous n'êtes membre ou manager d'aucune équipe. Contactez un administrateur du club."
        />
      ) : !activeTeam ? null : allEvents.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Aucun événement sur les 60 derniers jours"
          description={isManager
            ? "Créez d'abord un événement via le calendrier."
            : "Pas encore d'événement à afficher pour cette équipe."}
          cta={isManager ? { href: `/dashboard/team/calendar/new?teamId=${activeTeam.id}`, label: 'Créer un événement →' } : undefined}
        />
      ) : (
        <>
          {upcoming.length > 0 && (
            <Section title={`À venir (${upcoming.length})`} events={upcoming} isPast={false} isManager={isManager} />
          )}
          {past.length > 0 && (
            <Section title={`Passés — 60 derniers jours (${past.length})`} events={past} isPast={true} isManager={isManager} />
          )}
        </>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------

type EventSummary = Awaited<ReturnType<typeof listTeamEventsSummary>>[number]

function Section({
  title, events, isPast, isManager,
}: {
  title: string
  events: EventSummary[]
  isPast: boolean
  isManager: boolean
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
        {title}
      </h2>
      <div className="space-y-2">
        {events.map((event) => (
          <EventRow key={event.id} event={event} isPast={isPast} isManager={isManager} />
        ))}
      </div>
    </section>
  )
}

function EventRow({
  event, isPast, isManager,
}: {
  event: EventSummary
  isPast: boolean
  isManager: boolean
}) {
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
        opacity: isPast ? 0.85 : 1,
      }}
    >
      <span
        className="text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0"
        style={{ color: cfg.color, backgroundColor: cfg.bg }}
      >
        {cfg.icon} {cfg.label}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: '#353148' }}>
          {event.title}
        </p>
        <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
          {dateStr} à {timeStr}
          {event.location && ` · ${event.location}`}
        </p>
      </div>

      <span className="text-xs flex-shrink-0" style={{ color: '#8e8a9c' }}>
        {convCount > 0
          ? `${convCount} convoqué${convCount > 1 ? 's' : ''}`
          : 'Pas encore convoqué'}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {isManager && !isPast && (
          <Link
            href={`/dashboard/team/convocations/new?eventId=${event.id}`}
            className="text-xs px-2 py-1 rounded-lg font-medium"
            style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
          >
            {convCount > 0 ? '+ Ajouter' : 'Convoquer'}
          </Link>
        )}
        {convCount > 0 && (
          <Link
            href={`/dashboard/team/convocations/${event.id}`}
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

function EmptyState({
  icon, title, description, cta,
}: {
  icon: string
  title: string
  description: string
  cta?: { href: string; label: string }
}) {
  return (
    <div
      className="rounded-xl p-12 text-center"
      style={{ border: '1px solid #e4e0ec' }}
    >
      <p className="text-3xl mb-3">{icon}</p>
      <p className="text-sm font-medium" style={{ color: '#353148' }}>{title}</p>
      <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-4 inline-block text-sm font-medium"
          style={{ color: '#8c60f3' }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
