import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventForUser } from '@/app/dashboard/associatif/actions'
import { RegisterButton } from './_components/RegisterButton'
import { TaskToggle } from '@/app/dashboard/manager-associatif/events/[eventId]/_components/TaskControls'

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Événement',
}

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function UserEventPage({ params }: PageProps) {
  const { eventId } = await params
  const result = await getEventForUser(eventId)

  if (!result) notFound()

  const { event, isRegistered } = result

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div>
      {/* Header */}
      <div
        className="px-8 py-5"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e0ec' }}
      >
        <Link
          href="/dashboard/calendar"
          className="text-xs hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour au calendrier
        </Link>
        <h1 className="text-xl font-bold mt-1" style={{ color: '#353148' }}>
          {event.title}
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
          {TYPE_LABELS[event.type] ?? event.type} · {dateStr} à {timeStr}
          {event.team && <span> · {event.team.name}</span>}
        </p>
      </div>

      {/* Body */}
      <div className="p-8 max-w-xl space-y-5">

        {/* Infos carte */}
        <div
          className="rounded-xl p-5 space-y-3"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-24 flex-shrink-0" style={{ color: '#8e8a9c' }}>
              Date
            </span>
            <span className="text-sm" style={{ color: '#353148' }}>
              {dateStr} à {timeStr}
            </span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium w-24 flex-shrink-0" style={{ color: '#8e8a9c' }}>
                Lieu
              </span>
              <span className="text-sm" style={{ color: '#353148' }}>
                📍 {event.location}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium w-24 flex-shrink-0" style={{ color: '#8e8a9c' }}>
              Inscrits
            </span>
            <span className="text-sm" style={{ color: '#353148' }}>
              {event.registrations.length} participant{event.registrations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Inscription */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#353148' }}>
            Participation
          </h2>
          {isRegistered ? (
            <div className="flex items-center gap-3">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
              >
                ✓ Vous êtes inscrit(e)
              </span>
            </div>
          ) : (
            <p className="text-sm mb-3" style={{ color: '#8e8a9c' }}>
              Vous n&apos;êtes pas encore inscrit(e) à cet événement.
            </p>
          )}
          <div className="mt-3">
            <RegisterButton eventId={eventId} isRegistered={isRegistered} />
          </div>
        </div>

        {/* Mes tâches */}
        {event.tasks.length > 0 && (
          <div
            className="rounded-xl p-5"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
          >
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#353148' }}>
              Mes tâches ({event.tasks.filter((t) => t.done).length}/{event.tasks.length})
            </h2>
            <div className="space-y-3">
              {event.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 border-b last:border-b-0"
                  style={{ borderColor: '#f0edf8' }}
                >
                  <TaskToggle taskId={task.id} done={task.done} />
                  <span
                    className={`text-sm flex-1 ${task.done ? 'line-through' : ''}`}
                    style={{ color: task.done ? '#b0acbc' : '#353148' }}
                  >
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
