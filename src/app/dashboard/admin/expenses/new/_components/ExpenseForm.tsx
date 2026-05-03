'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createExpense } from '@/app/dashboard/finance/actions'

const initialState = { success: false as const, error: '' }

const CATEGORY_LABELS: Record<string, string> = {
  equipement:    '🎽 Équipement',
  deplacement:   '🚌 Déplacement',
  arbitrage:     '🟡 Arbitrage',
  licence:       '📋 Licence / inscription',
  communication: '📢 Communication',
  autre:         '📦 Autre',
}

interface Props {
  redirectTo: string
}

export function ExpenseForm({ redirectTo }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createExpense, initialState)

  useEffect(() => {
    if (state.success) {
      router.push(redirectTo)
    }
  }, [state.success, router, redirectTo])

  return (
    <form action={formAction} className="space-y-5">
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
          placeholder="45.00"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        />
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Catégorie <span style={{ color: '#c0392b' }}>*</span>
        </label>
        <select
          name="category"
          required
          className="w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        >
          <option value="">— Choisir une catégorie —</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Description <span className="font-normal" style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <textarea
          name="description"
          rows={3}
          placeholder="Ex: Maillots équipe U17 x 15"
          maxLength={500}
          className="w-full rounded-xl border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2"
          style={{ borderColor: '#e4e0ec', color: '#353148' }}
        />
      </div>

      {/* Justificatif URL */}
      <div>
        <label className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
          Lien justificatif <span className="font-normal" style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <input
          name="receiptUrl"
          type="url"
          placeholder="https://…"
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
          {isPending ? 'Enregistrement…' : 'Ajouter la dépense'}
        </button>
        <a
          href={redirectTo}
          className="text-sm"
          style={{ color: '#8e8a9c' }}
        >
          Annuler
        </a>
      </div>
    </form>
  )
}
