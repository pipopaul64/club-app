'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

type Manager = {
  id: string
  name: string
  role: string
}

type Props = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  managers: Manager[]
  currentManagerId?: string
}

const initialState: ActionResult = { success: false, error: '' }

export function AssignManagerForm({ action, managers, currentManagerId }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      router.refresh()
    }
  }, [state.success, router])

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }

  return (
    <form action={formAction} className="flex gap-2 items-start">
      <div className="flex-1">
        <select
          name="managerId"
          defaultValue={currentManagerId ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
        >
          <option value="">— Aucun manager —</option>
          {managers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        {!state.success && state.error && (
          <p className="text-xs mt-1" style={{ color: '#c0392b' }}>
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="text-xs mt-1" style={{ color: '#1a7a4a' }}>
            Manager mis à jour
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 whitespace-nowrap"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {pending ? '…' : 'Assigner'}
      </button>
    </form>
  )
}
