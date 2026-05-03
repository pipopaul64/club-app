'use client'

import { useTransition } from 'react'
import { toggleTaskDone, deleteTask, assignTask } from '@/app/dashboard/associatif/actions'

type Member = { id: string; name: string }

interface TaskRowProps {
  taskId: string
  done: boolean
  assigneeId: string | null
  members: Member[]
}

export function TaskToggle({ taskId, done }: { taskId: string; done: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await toggleTaskDone(taskId) })}
      disabled={pending}
      title={done ? 'Marquer comme non faite' : 'Marquer comme faite'}
      className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50"
      style={
        done
          ? { backgroundColor: '#8c60f3', border: '1.5px solid #8c60f3' }
          : { backgroundColor: '#ffffff', border: '1.5px solid #d1cce0' }
      }
    >
      {done && <span className="text-white text-xs leading-none">✓</span>}
    </button>
  )
}

export function TaskDelete({ taskId }: { taskId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (!confirm('Supprimer cette tâche ?')) return
        startTransition(async () => { await deleteTask(taskId) })
      }}
      disabled={pending}
      title="Supprimer"
      className="text-xs px-2 py-1 rounded transition-colors disabled:opacity-50"
      style={{ color: '#c0392b' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fdf0f0')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
    >
      {pending ? '…' : '🗑'}
    </button>
  )
}

export function TaskAssignSelect({ taskId, assigneeId, members }: {
  taskId: string
  assigneeId: string | null
  members: Member[]
}) {
  const [pending, startTransition] = useTransition()

  return (
    <select
      value={assigneeId ?? ''}
      disabled={pending}
      onChange={(e) => {
        const val = e.target.value || null
        startTransition(async () => { await assignTask(taskId, val) })
      }}
      className="text-xs px-2 py-1 rounded-lg outline-none transition-all disabled:opacity-50"
      style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
    >
      <option value="">— Non assigné —</option>
      {members.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  )
}

// Combined row component for convenience
export function TaskRow({ taskId, done, assigneeId, members }: TaskRowProps) {
  return (
    <div className="flex items-center gap-3">
      <TaskToggle taskId={taskId} done={done} />
      <TaskAssignSelect taskId={taskId} assigneeId={assigneeId} members={members} />
      <TaskDelete taskId={taskId} />
    </div>
  )
}
