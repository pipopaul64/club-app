import Link from 'next/link'
import { Suspense } from 'react'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { listEvents, listAccessibleTeams } from '@/app/dashboard/events/actions'
import { TeamFilter } from '@/app/dashboard/events/_components/TeamFilter'
import type { UserRole, EventType } from '@/db/schema'

// ---------------------------------------------------------------------------
// Helpers date (sans librairie externe)
// ---------------------------------------------------------------------------
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

function currentMonthStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function prevMonthStr(year: number, month: number): string {
  if (month === 1) return `${year - 1}-12`
  return `${year}-${String(month - 1).padStart(2, '0')}`
}

function nextMonthStr(year: number, month: number): string {
  if (month === 12) return `${year + 1}-01`
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ---------------------------------------------------------------------------
// Couleurs par type d'événement
// ---------------------------------------------------------------------------
const EVENT_COLORS: Record<EventType, { color: string; bg: string; label: string }> = {
  match: { color: '#c0392b', bg: '#fdf0f0', label: 'Match' },
  training: { color: '#2563eb', bg: '#eff6ff', label: 'Entraînement' },
  other: { color: '#8c60f3', bg: '#f3f0ff', label: 'Autre' },
}

// ---------------------------------------------------------------------------
// Lien "Ajouter un événement" selon le rôle
// ---------------------------------------------------------------------------
function AddEventLink({ role }: { role: UserRole }) {
  if (role === 'user' || role === 'manager_associatif') return null
  const href =
    role === 'admin'
      ? '/dashboard/admin/events/new'
      : '/dashboard/manager/events/new'
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm font-medium rounded-lg text-white"
      style={{ backgroundColor: '#8c60f3' }}
    >
      + Ajouter un événement
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Page principale
// ---------------------------------------------------------------------------
type Props = {
  searchParams: Promise<{ month?: string; teamId?: string }>
}

export default async function CalendarPage({ searchParams }: Props) {
  const { month: monthParam, teamId } = await searchParams
  const currentMonth = monthParam ?? currentMonthStr()

  const [year, month] = currentMonth.split('-').map(Number)

  // Session + rôle — appel direct pour éviter les erreurs Better-Auth en SSR
  let session = null
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch {
    redirect('/login')
  }
  if (!session) redirect('/login')
  const role = ((session.user as { role?: string }).role ?? 'user') as UserRole

  // Données en parallèle
  const [eventList, teams] = await Promise.all([
    listEvents({ month: currentMonth, teamId }),
    listAccessibleTeams(),
  ])

  // Calendrier
  const daysInMonth = new Date(year, month, 0).getDate()
  // Lundi = 0, Dimanche = 6 (convention européenne)
  const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7

  // Regrouper les événements par jour du mois
  const eventsByDay = new Map<number, typeof eventList>()
  for (const event of eventList) {
    const day = new Date(event.date).getDate()
    if (!eventsByDay.has(day)) eventsByDay.set(day, [])
    eventsByDay.get(day)!.push(event)
  }

  // Date du jour pour le highlight
  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          {/* Navigation mois */}
          <Link
            href={`/dashboard/calendar?month=${prevMonthStr(year, month)}${teamId ? `&teamId=${teamId}` : ''}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
            style={{ border: '1px solid #e4e0ec', color: '#353148' }}
          >
            ‹
          </Link>
          <h1 className="text-xl font-bold min-w-40 text-center" style={{ color: '#353148' }}>
            {MONTHS_FR[month - 1]} {year}
          </h1>
          <Link
            href={`/dashboard/calendar?month=${nextMonthStr(year, month)}${teamId ? `&teamId=${teamId}` : ''}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
            style={{ border: '1px solid #e4e0ec', color: '#353148' }}
          >
            ›
          </Link>

          {/* Retour au mois courant */}
          {currentMonth !== currentMonthStr() && (
            <Link
              href="/dashboard/calendar"
              className="text-xs px-2 py-1 rounded-md"
              style={{ color: '#8c60f3', backgroundColor: '#8c60f318' }}
            >
              Aujourd&apos;hui
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Filtre équipe */}
          <Suspense>
            <TeamFilter teams={teams} currentTeamId={teamId} />
          </Suspense>

          {/* Bouton ajout selon le rôle */}
          <AddEventLink role={role} />
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 mb-4">
        {Object.entries(EVENT_COLORS).map(([type, { color, bg, label }]) => (
          <div key={type} className="flex items-center gap-1.5">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color, backgroundColor: bg }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Grille calendrier */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid #e4e0ec' }}
      >
        {/* En-têtes des jours */}
        <div className="grid grid-cols-7" style={{ backgroundColor: '#f8f6fc' }}>
          {DAYS_FR.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-xs font-medium text-center"
              style={{ color: '#8e8a9c', borderBottom: '1px solid #e4e0ec' }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Cellules des jours */}
        <div className="grid grid-cols-7">
          {/* Cellules vides avant le 1er */}
          {Array.from({ length: firstDayOfWeek }, (_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-24 p-1"
              style={{
                backgroundColor: '#fafafa',
                borderRight: '1px solid #f0eef8',
                borderBottom: '1px solid #f0eef8',
              }}
            />
          ))}

          {/* Jours du mois */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const dayEvents = eventsByDay.get(day) ?? []
            const isToday = isCurrentMonth && today.getDate() === day
            const cellIndex = firstDayOfWeek + i
            const isLastRow = cellIndex >= (Math.ceil((firstDayOfWeek + daysInMonth) / 7) - 1) * 7

            return (
              <div
                key={day}
                className="min-h-24 p-1.5"
                style={{
                  backgroundColor: isToday ? '#f3f0ff' : '#ffffff',
                  borderRight: (cellIndex + 1) % 7 === 0 ? 'none' : '1px solid #f0eef8',
                  borderBottom: isLastRow ? 'none' : '1px solid #f0eef8',
                }}
              >
                {/* Numéro du jour */}
                <div className="mb-1">
                  <span
                    className="text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full"
                    style={
                      isToday
                        ? { backgroundColor: '#8c60f3', color: '#ffffff' }
                        : { color: '#8e8a9c' }
                    }
                  >
                    {day}
                  </span>
                </div>

                {/* Événements */}
                <div className="space-y-0.5">
                  {dayEvents.map((event) => {
                    const cfg = EVENT_COLORS[event.type as EventType]
                    return (
                      <div
                        key={event.id}
                        className="text-xs px-1.5 py-0.5 rounded truncate"
                        style={{ color: cfg.color, backgroundColor: cfg.bg }}
                        title={`${formatTime(new Date(event.date))} — ${event.title}${event.team ? ` (${event.team.name})` : ''}`}
                      >
                        <span className="font-medium">{formatTime(new Date(event.date))}</span>{' '}
                        {event.title}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Cellules vides en fin de grille pour compléter la dernière ligne */}
          {(() => {
            const total = firstDayOfWeek + daysInMonth
            const remainder = total % 7
            if (remainder === 0) return null
            return Array.from({ length: 7 - remainder }, (_, i) => (
              <div
                key={`end-${i}`}
                className="min-h-24 p-1"
                style={{ backgroundColor: '#fafafa' }}
              />
            ))
          })()}
        </div>
      </div>

      {/* Aucun événement */}
      {eventList.length === 0 && (
        <p className="text-center text-sm mt-6" style={{ color: '#8e8a9c' }}>
          Aucun événement ce mois-ci.
        </p>
      )}
    </div>
  )
}
