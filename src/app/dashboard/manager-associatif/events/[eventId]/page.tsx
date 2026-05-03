import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventDetail, listClubMembers } from '@/app/dashboard/associatif/actions'
import { AddTaskForm } from './_components/AddTaskForm'
import { TaskRow } from './_components/TaskControls'

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Événement',
}

interface PageProps {
  params: Promise<{ eventId: string }>
}

export default async function ManageEventPage({ params }: PageProps) {
  const { eventId } = await params
  const [event, members] = await Promise.all([
    getEventDetail(eventId),
    listClubMembers(),
  ])

  if (!event) notFound()

  const tasksDone  = event.tasks.filter((t) => t.done).length
  const tasksTotal = event.tasks.length

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
          href="/dashboard/manager-associatif/events"
          className="text-xs hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux événements
        </Link>
        <div className="flex items-start gap-3 mt-1">
          <div className="flex-1">
            <h1 className="text-xl font-bold" style={{ color: '#353148' }}>
              {event.title}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
              {TYPE_LABELS[event.type] ?? event.type} · {dateStr} à {timeStr}
              {event.team && <span> · {event.team.name}</span>}
              {event.location && <span> · 📍 {event.location}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

        {/* ------------------------------------------------------------------ */}
        {/* TÂCHES */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#353148' }}>
              Tâches
            </h2>
            {tasksTotal > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f3f0ff', color: '#8c60f3' }}>
                {tasksDone}/{tasksTotal} faites
              </span>
            )}
          </div>

          {/* Liste */}
          <div className="space-y-3 mb-4">
            {event.tasks.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: '#b0acbc' }}>
                Aucune tâche pour cet événement.
              </p>
            ) : (
              event.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 border-b last:border-b-0"
                  style={{ borderColor: '#f0edf8' }}
                >
                  {/* Checkbox + titre */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span
                      className={`text-sm truncate ${task.done ? 'line-through' : ''}`}
                      style={{ color: task.done ? '#b0acbc' : '#353148' }}
                    >
                      {task.title}
                    </span>
                  </div>
                  {/* Controls */}
                  <TaskRow
                    taskId={task.id}
                    done={task.done}
                    assigneeId={task.assignee?.id ?? null}
                    members={members}
                  />
                </div>
              ))
            )}
          </div>

          {/* Formulaire ajout */}
          <div className="pt-3" style={{ borderTop: '1px solid #f0edf8' }}>
            <AddTaskForm eventId={eventId} members={members} />
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* INSCRIPTIONS */}
        {/* ------------------------------------------------------------------ */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#353148' }}>
              Inscriptions
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#f3f0ff', color: '#8c60f3' }}
            >
              {event.registrations.length} inscrit{event.registrations.length !== 1 ? 's' : ''}
            </span>
          </div>

          {event.registrations.length === 0 ? (
            <p className="text-sm py-4 text-center" style={{ color: '#b0acbc' }}>
              Personne n&apos;est encore inscrit.
            </p>
          ) : (
            <ul className="space-y-2">
              {event.registrations.map((reg) => (
                <li
                  key={reg.id}
                  className="flex items-center gap-3 py-2 border-b last:border-b-0"
                  style={{ borderColor: '#f0edf8' }}
                >
                  {/* Avatar initiale */}
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#f3f0ff', color: '#8c60f3' }}
                  >
                    {reg.user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#353148' }}>
                      {reg.user.name}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#8e8a9c' }}>
                      {reg.user.email}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
