'use client'

import { useRouter } from 'next/navigation'

type Event = {
  id: string
  title: string
  type: string
  date: Date
  team?: { name: string } | null
}

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Autre',
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

type Props = {
  events: Event[]
  currentEventId?: string
}

export function EventSelect({ events, currentEventId }: Props) {
  const router = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value) {
      router.push(`/dashboard/team/convocations/new?eventId=${e.target.value}`)
    }
  }

  return (
    <select
      defaultValue={currentEventId ?? ''}
      onChange={handleChange}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
      style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
    >
      <option value="">Sélectionner un événement…</option>
      {events.map((ev) => (
        <option key={ev.id} value={ev.id}>
          {TYPE_LABELS[ev.type] ?? ev.type} — {ev.title}
          {ev.team ? ` (${ev.team.name})` : ''} · {formatDate(ev.date)}
        </option>
      ))}
    </select>
  )
}
