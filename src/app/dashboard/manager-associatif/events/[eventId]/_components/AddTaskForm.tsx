'use client'

import { useActionState, useEffect, useRef } from 'react'
import { createTask } from '@/app/dashboard/associatif/actions'
import type { ActionResult } from '@/types'

type Member = { id: string; name: string }

interface Props {
  eventId: string
  members: Member[]
}

const initialState: ActionResult = { success: false, error: '' }

export function AddTaskForm({ eventId, members }: Props) {
  const boundAction = createTask.bind(null, eventId)
  const [state, formAction, pending] = useActionState(boundAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
    }
  }, [state.success])

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }

  return (
    <form ref={formRef} action={formAction} className="flex gap-2 items-end flex-wrap">
      {/* Titre */}
      <div className="flex-1 min-w-48">
        <label htmlFor="task-title" className="block text-xs font-medium mb-1" style={{ color: '#353148' }}>
          Nouvelle tâche
        </label>
        <input
          id="task-title"
          name="title"
          type="text"
          required
          placeholder="Ex : Accueil des invités"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e)  => (e.target.style.borderColor = '#e4e0ec')}
        />
      </div>

      {/* Assignée (optionnel) */}
      <div className="w-48">
        <label htmlFor="task-assignee" className="block text-xs font-medium mb-1" style={{ color: '#353148' }}>
          Bénévole <span style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <select
          id="task-assignee"
          name="assigneeId"
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e)  => (e.target.style.borderColor = '#e4e0ec')}
        >
          <option value="">— Non assigné —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {pending ? '…' : 'Ajouter'}
      </button>

      {/* Erreur */}
      {!state.success && state.error && (
        <p className="w-full text-xs mt-1" style={{ color: '#c0392b' }}>
          {state.error}
        </p>
      )}
    </form>
  )
}
