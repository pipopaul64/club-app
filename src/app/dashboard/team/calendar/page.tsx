import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { listEvents } from '@/app/dashboard/events/actions'
import { listMyTeams, pickActiveTeam } from '@/lib/my-teams'
import { TeamPicker } from '@/components/dashboard/TeamPicker'
import { TypeFilter } from '@/app/dashboard/events/_components/TypeFilter'
import type { EventType, UserRole } from '@/db/schema'

// ===========================================================================
// CONSTANTES
// ===========================================================================

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]
const DAYS_SHORT_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const DAYS_LONG_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']

type CalendarView = 'month' | 'week' | 'day'

// ===========================================================================
// UTILITAIRES DATE (timezone locale)
// ===========================================================================

function localDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function currentMonthStr(): string {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
}

function prevMonth(year: number, month: number): string {
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}
function nextMonth(year: number, month: number): string {
  return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`
}

function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const dow = d.getDay() // 0=Sun
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow))
  d.setHours(0, 0, 0, 0)
  return d
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate()
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDayLong(date: Date): string {
  const idx = (date.getDay() + 6) % 7
  return `${DAYS_LONG_FR[idx]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`
}

// ===========================================================================
// BUILDER D'URL — préserve teamId actif + filtres
// ===========================================================================

function calUrl(params: {
  view?:   CalendarView
  month?:  string
  date?:   string
  teamId:  string             // toujours présent dans /team/calendar
  type?:   string
}): string {
  const p = new URLSearchParams()
  if (params.view && params.view !== 'month') p.set('view', params.view)
  if (params.month) p.set('month', params.month)
  if (params.date)  p.set('date', params.date)
  p.set('teamId', params.teamId)
  if (params.type) p.set('type', params.type)
  return `/dashboard/team/calendar?${p.toString()}`
}

// ===========================================================================
// COULEURS D'ÉVÉNEMENTS
// ===========================================================================

const EVENT_COLORS: Record<EventType, { color: string; bg: string; label: string }> = {
  match:    { color: '#c0392b', bg: '#fdf0f0', label: 'Match' },
  training: { color: '#2563eb', bg: '#eff6ff', label: 'Entraînement' },
  other:    { color: '#8c60f3', bg: '#f3f0ff', label: 'Autre' },
}

// ===========================================================================
// COMPOSANTS PARTAGÉS
// ===========================================================================

function ViewSwitcher({
  view, month, date, teamId, type,
}: {
  view:   CalendarView
  month:  string
  date:   string
  teamId: string
  type?:  string
}) {
  const views: { key: CalendarView; label: string }[] = [
    { key: 'month', label: 'Mois' },
    { key: 'week',  label: 'Semaine' },
    { key: 'day',   label: 'Jour' },
  ]
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #e4e0ec' }}>
      {views.map(({ key, label }) => (
        <Link
          key={key}
          href={calUrl({ view: key, month, date, teamId, type })}
          className="px-3 py-1.5 text-sm font-medium transition-colors"
          style={
            view === key
              ? { backgroundColor: '#8c60f3', color: '#ffffff' }
              : { backgroundColor: '#ffffff', color: '#353148' }
          }
        >
          {label}
        </Link>
      ))}
    </div>
  )
}

type EventList = Awaited<ReturnType<typeof listEvents>>

function EventBadge({ event }: { event: EventList[number] }) {
  const cfg = EVENT_COLORS[event.type as EventType]
  return (
    <div
      className="text-xs px-1.5 py-0.5 rounded truncate cursor-default"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
      title={`${formatTime(new Date(event.date))} — ${event.title}${event.team ? ` (${event.team.name})` : ''}`}
    >
      <span className="font-semibold">{formatTime(new Date(event.date))}</span>{' '}
      {event.title}
    </div>
  )
}

function EventCard({ event }: { event: EventList[number] }) {
  const cfg = EVENT_COLORS[event.type as EventType]
  return (
    <div
      className="px-4 py-3 rounded-xl"
      style={{ backgroundColor: cfg.bg, border: `1px solid ${cfg.color}22` }}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg font-bold" style={{ color: '#353148' }}>
          {formatTime(new Date(event.date))}
        </span>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{ color: cfg.color, backgroundColor: cfg.color + '22' }}
        >
          {cfg.label}
        </span>
      </div>
      <p className="font-semibold text-sm" style={{ color: '#353148' }}>{event.title}</p>
      {event.team && (
        <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>{event.team.name}</p>
      )}
      {event.location && (
        <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>📍 {event.location}</p>
      )}
    </div>
  )
}

// ===========================================================================
// VUES (mois / semaine / jour)
// ===========================================================================

function MonthView({
  year, month, events,
}: {
  year:   number
  month:  number
  events: EventList
}) {
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7

  const byDay = new Map<number, EventList>()
  for (const evt of events) {
    const d = new Date(evt.date).getDate()
    if (!byDay.has(d)) byDay.set(d, [])
    byDay.get(d)!.push(evt)
  }

  const totalCells = firstDayOfWeek + daysInMonth
  const trailingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e0ec' }}>
      <div className="grid grid-cols-7" style={{ backgroundColor: '#f8f6fc' }}>
        {DAYS_SHORT_FR.map((d) => (
          <div
            key={d}
            className="py-2 text-xs font-medium text-center"
            style={{ color: '#8e8a9c', borderBottom: '1px solid #e4e0ec' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfWeek }, (_, i) => (
          <div key={`pre-${i}`} className="min-h-24 p-1"
            style={{ backgroundColor: '#fafafa', borderRight: '1px solid #f0eef8', borderBottom: '1px solid #f0eef8' }}
          />
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const dayEvents = byDay.get(day) ?? []
          const isToday = isCurrentMonth && today.getDate() === day
          const cellIdx = firstDayOfWeek + i
          const isLastRow = cellIdx >= (Math.ceil(totalCells / 7) - 1) * 7
          const isLastCol = (cellIdx + 1) % 7 === 0

          return (
            <div
              key={day}
              className="min-h-24 p-1.5"
              style={{
                backgroundColor: isToday ? '#f3f0ff' : '#ffffff',
                borderRight: isLastCol ? 'none' : '1px solid #f0eef8',
                borderBottom: isLastRow ? 'none' : '1px solid #f0eef8',
              }}
            >
              <div className="mb-1">
                <span
                  className="text-xs font-semibold w-6 h-6 inline-flex items-center justify-center rounded-full"
                  style={isToday
                    ? { backgroundColor: '#8c60f3', color: '#ffffff' }
                    : { color: '#8e8a9c' }
                  }
                >
                  {day}
                </span>
              </div>
              <div className="space-y-0.5">
                {dayEvents.map((evt) => <EventBadge key={evt.id} event={evt} />)}
              </div>
            </div>
          )
        })}

        {Array.from({ length: trailingCells }, (_, i) => (
          <div key={`post-${i}`} className="min-h-24 p-1"
            style={{ backgroundColor: '#fafafa' }}
          />
        ))}
      </div>
    </div>
  )
}

function WeekView({ monday, events }: { monday: Date; events: EventList }) {
  const today = new Date()

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(monday, i)
    return { date: d, key: localDateKey(d) }
  })

  const byDay = new Map<string, EventList>()
  for (const evt of events) {
    const key = localDateKey(new Date(evt.date))
    if (!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(evt)
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e0ec' }}>
      <div className="grid grid-cols-7">
        {days.map(({ date, key }, i) => {
          const isToday = isSameDay(date, today)
          const dayEvents = byDay.get(key) ?? []
          const isLast = i === 6

          return (
            <div
              key={key}
              style={{ borderRight: isLast ? 'none' : '1px solid #e4e0ec' }}
            >
              <div
                className="px-1 py-2 text-center"
                style={{
                  backgroundColor: isToday ? '#f3f0ff' : '#f8f6fc',
                  borderBottom: '1px solid #e4e0ec',
                }}
              >
                <div className="text-xs font-medium" style={{ color: '#8e8a9c' }}>
                  {DAYS_SHORT_FR[i]}
                </div>
                <div
                  className="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mx-auto mt-0.5"
                  style={isToday
                    ? { backgroundColor: '#8c60f3', color: '#ffffff' }
                    : { color: '#353148' }
                  }
                >
                  {date.getDate()}
                </div>
              </div>

              <div
                className="min-h-36 p-1 space-y-0.5"
                style={{ backgroundColor: isToday ? '#fdfcff' : '#ffffff' }}
              >
                {dayEvents.map((evt) => <EventBadge key={evt.id} event={evt} />)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DayView({ events }: { events: EventList }) {
  if (events.length === 0) {
    return (
      <div
        className="rounded-xl p-10 text-center"
        style={{ border: '1px solid #e4e0ec' }}
      >
        <p className="text-sm" style={{ color: '#8e8a9c' }}>
          Aucun événement ce jour.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {events.map((evt) => <EventCard key={evt.id} event={evt} />)}
    </div>
  )
}

// ===========================================================================
// PAGE PRINCIPALE
// ===========================================================================

type Props = {
  searchParams: Promise<{
    view?:   string
    month?:  string
    date?:   string
    teamId?: string
    type?:   string
  }>
}

export default async function TeamCalendarPage({ searchParams }: Props) {
  const {
    view:   viewParam,
    month:  monthParam,
    date:   dateParam,
    teamId: requestedTeamId,
    type,
  } = await searchParams

  // Auth
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  const userId = session.user.id
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) redirect('/dashboard')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]

  // Équipes
  const myTeams    = await listMyTeams(userId, clubId, roles)
  const activeTeam = pickActiveTeam(myTeams, requestedTeamId)
  const isManager  = roles.includes('manager') || roles.includes('admin')

  // Empty state si aucune équipe
  if (!activeTeam) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-xl font-bold mb-4" style={{ color: '#353148' }}>Calendrier</h1>
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <p className="text-2xl mb-2">🏃</p>
          <p className="text-sm font-medium" style={{ color: '#353148' }}>
            Aucune équipe pour le moment
          </p>
          <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
            Vous n&apos;êtes membre ou manager d&apos;aucune équipe. Contactez un administrateur du club.
          </p>
        </div>
      </div>
    )
  }

  // Vue active (défaut : mois)
  const view: CalendarView =
    viewParam === 'week' ? 'week' : viewParam === 'day' ? 'day' : 'month'

  // Date d'ancrage pour semaine/jour
  const anchorDate = dateParam
    ? new Date(dateParam + 'T00:00:00')
    : new Date()
  const anchorDateStr = localDateKey(anchorDate)

  // Mois pour la vue mensuelle
  const currentMonth = monthParam ?? currentMonthStr()
  const [year, month] = currentMonth.split('-').map(Number)

  // Lundi de la semaine courante
  const monday = getMondayOfWeek(anchorDate)
  const sunday = addDays(monday, 6)

  // Plage de dates pour la requête
  const dateRange =
    view === 'week'
      ? {
          start: monday,
          end:   new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate(), 23, 59, 59),
        }
      : view === 'day'
      ? {
          start: new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 0, 0, 0),
          end:   new Date(anchorDate.getFullYear(), anchorDate.getMonth(), anchorDate.getDate(), 23, 59, 59),
        }
      : undefined

  // Filtré sur l'équipe active uniquement
  const eventList = await listEvents({
    month:     view === 'month' ? currentMonth : undefined,
    dateRange: view !== 'month' ? dateRange    : undefined,
    teamId:    activeTeam.id,
    type,
  })

  const activeMonth =
    view === 'month'
      ? currentMonth
      : `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, '0')}`

  // Titre de navigation + URLs prev/next
  const teamId = activeTeam.id
  let navTitle = ''
  let prevUrl = ''
  let nextUrl = ''

  if (view === 'month') {
    navTitle = `${MONTHS_FR[month - 1]} ${year}`
    prevUrl = calUrl({ view: 'month', month: prevMonth(year, month), teamId, type })
    nextUrl = calUrl({ view: 'month', month: nextMonth(year, month), teamId, type })
  } else if (view === 'week') {
    const mM = monday.getMonth()
    const sM = sunday.getMonth()
    navTitle = mM === sM
      ? `${monday.getDate()} – ${sunday.getDate()} ${MONTHS_FR[mM]} ${monday.getFullYear()}`
      : `${monday.getDate()} ${MONTHS_FR[mM]} – ${sunday.getDate()} ${MONTHS_FR[sM]}`
    prevUrl = calUrl({ view: 'week', date: localDateKey(addDays(monday, -7)), teamId, type })
    nextUrl = calUrl({ view: 'week', date: localDateKey(addDays(monday,  7)), teamId, type })
  } else {
    navTitle = formatDayLong(anchorDate)
    prevUrl = calUrl({ view: 'day', date: localDateKey(addDays(anchorDate, -1)), teamId, type })
    nextUrl = calUrl({ view: 'day', date: localDateKey(addDays(anchorDate,  1)), teamId, type })
  }

  const showToday =
    view === 'month'
      ? currentMonth !== currentMonthStr()
      : !isSameDay(anchorDate, new Date())

  const todayUrl =
    view === 'month'
      ? calUrl({ teamId, type })
      : calUrl({ view, date: localDateKey(new Date()), teamId, type })

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Ligne 1 : navigation + titre + switcher de vue */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Link
              href={prevUrl}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:opacity-70 transition-opacity"
              style={{ border: '1px solid #e4e0ec', color: '#353148' }}
            >
              ‹
            </Link>
            <h1
              className="text-lg font-bold text-center min-w-52"
              style={{ color: '#353148' }}
            >
              {navTitle}
            </h1>
            <Link
              href={nextUrl}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-lg hover:opacity-70 transition-opacity"
              style={{ border: '1px solid #e4e0ec', color: '#353148' }}
            >
              ›
            </Link>
            {showToday && (
              <Link
                href={todayUrl}
                className="text-xs px-2 py-1 rounded-md"
                style={{ color: '#8c60f3', backgroundColor: '#8c60f318' }}
              >
                Aujourd&apos;hui
              </Link>
            )}
          </div>

          <ViewSwitcher
            view={view}
            month={activeMonth}
            date={anchorDateStr}
            teamId={teamId}
            type={type}
          />
        </div>

        {/* Ligne 2 : picker équipe + filtre type + bouton ajout */}
        <div className="flex items-center gap-3 flex-wrap">
          <TeamPicker teams={myTeams} activeId={activeTeam.id} />
          <Suspense>
            <TypeFilter currentType={type} />
          </Suspense>
          {isManager && (
            <Link
              href={`/dashboard/team/calendar/new?teamId=${activeTeam.id}`}
              className="ml-auto px-4 py-2 text-sm font-medium rounded-lg text-white whitespace-nowrap"
              style={{ backgroundColor: '#8c60f3' }}
            >
              + Nouvel événement
            </Link>
          )}
        </div>
      </div>

      {/* ── Légende ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {Object.entries(EVENT_COLORS).map(([t, { color, bg, label }]) => (
          <span
            key={t}
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ color, backgroundColor: bg }}
          >
            {label}
          </span>
        ))}
      </div>

      {/* ── Vues ───────────────────────────────────────────────────────── */}
      {view === 'month' && (
        <>
          <MonthView year={year} month={month} events={eventList} />
          {eventList.length === 0 && (
            <p className="text-center text-sm mt-6" style={{ color: '#8e8a9c' }}>
              Aucun événement ce mois-ci.
            </p>
          )}
        </>
      )}

      {view === 'week' && (
        <>
          <WeekView monday={monday} events={eventList} />
          {eventList.length === 0 && (
            <p className="text-center text-sm mt-4" style={{ color: '#8e8a9c' }}>
              Aucun événement cette semaine.
            </p>
          )}
        </>
      )}

      {view === 'day' && (
        <DayView events={eventList} />
      )}
    </div>
  )
}
