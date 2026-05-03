'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCotisation } from '@/app/dashboard/finance/actions'

const initialState = { success: false as const, error: '' }

interface ClubUser {
  id:    string
  name:  string | null
  email: string
}

export function CotisationForm({ users }: { users: ClubUser[] }) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createCotisation, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/cotisations')
    }
  }, [state.success, router])

  // Default due date = 3 months from now
  const defaultDue = new Date()
  defaultDue.setMonth(defaultDue.getMonth() + 3)
  const defaultDueStr = defaultDue.toISOString().split('T')[0]

  return (
    <form action={formAction} className="space-y-5">
      {/* Licencié */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Licencié <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <select
          name="userId"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        >
          <option value="">— Sélectionner un licencié —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? '(en attente)'} ({u.email})
            </option>
          ))}
        </select>
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Montant (€) <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="120.00"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        />
      </div>

      {/* Date d'échéance */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Date d&apos;échéance <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <input
          name="dueDate"
          type="date"
          defaultValue={defaultDueStr}
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        />
      </div>

      {/* Erreur */}
      {!state.success && state.error && (
        <p className="text-sm" style={{ color: '#c0392b' }}>{state.error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {isPending ? 'Enregistrement…' : 'Créer la cotisation'}
        </button>
        <a
          href="/dashboard/admin/cotisations"
          className="text-sm"
          style={{ color: '#8e8a9c' }}
        >
          Annuler
        </a>
      </div>
    </form>
  )
}
