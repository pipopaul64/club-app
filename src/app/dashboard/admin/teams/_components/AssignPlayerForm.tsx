'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

type Player = {
  id: string
  name: string
  role: string
}

type Props = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  players: Player[]
}

const initialState: ActionResult = { success: false, error: '' }

export function AssignPlayerForm({ action, players }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)
  const selectRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    if (state.success) {
      // Réinitialiser le select et rafraîchir les données du Server Component
      if (selectRef.current) selectRef.current.value = ''
      router.refresh()
    }
  }, [state.success, router])

  if (players.length === 0) {
    return (
      <p className="text-sm" style={{ color: '#8e8a9c' }}>
        Tous les licenciés sont déjà dans une équipe pour cette saison.
      </p>
    )
  }

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }

  return (
    <form action={formAction} className="flex gap-2 items-start">
      <div className="flex-1">
        <select
          ref={selectRef}
          name="userId"
          required
          defaultValue=""
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
        >
          <option value="" disabled>
            Sélectionner un licencié…
          </option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {!state.success && state.error && (
          <p className="text-xs mt-1" style={{ color: '#c0392b' }}>
            {state.error}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 whitespace-nowrap"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {pending ? '…' : 'Ajouter'}
      </button>
    </form>
  )
}
