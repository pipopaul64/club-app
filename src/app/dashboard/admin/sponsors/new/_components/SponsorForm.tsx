'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSponsor } from '@/app/dashboard/finance/actions'

const initialState = { success: false as const, error: '' }

const todayStr = new Date().toISOString().split('T')[0]

export function SponsorForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createSponsor, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/sponsors')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-5">
      {/* Nom */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Nom du sponsor <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <input
          name="name"
          type="text"
          placeholder="Ex: Boulangerie Martin"
          required
          minLength={2}
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        />
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Montant annuel (€) <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="500.00"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
            Début <span style={{ color: '#c0392b' }}>*</span>
          </label>
          <input
            name="startDate"
            type="date"
            defaultValue={todayStr}
            required
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#e4e0ec', color: '#353148' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
            Fin <span className="font-normal" style={{ color: '#8e8a9c' }}>(optionnel)</span>
          </label>
          <input
            name="endDate"
            type="date"
            className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#e4e0ec', color: '#353148' }}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Notes <span className="font-normal" style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <textarea
          name="notes"
          rows={3}
          placeholder="Ex: Partenaire maillot, contacté via Pierre Dupont"
          maxLength={1000}
          className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
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
          {isPending ? 'Enregistrement…' : 'Ajouter le sponsor'}
        </button>
        <a
          href="/dashboard/admin/sponsors"
          className="text-sm"
          style={{ color: '#8e8a9c' }}
        >
          Annuler
        </a>
      </div>
    </form>
  )
}
