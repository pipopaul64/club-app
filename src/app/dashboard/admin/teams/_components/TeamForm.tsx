'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

type TeamFormValues = {
  name?: string
  category?: string
  season?: string
}

type TeamFormProps = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  defaultValues?: TeamFormValues
  submitLabel: string
  cancelHref: string
}

const initialState: ActionResult = { success: false, error: '' }

export function TeamForm({ action, defaultValues, submitLabel, cancelHref }: TeamFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/teams')
    }
  }, [state.success, router])

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }

  const labelStyle = { color: '#353148' }

  return (
    <form action={formAction} className="space-y-5">
      {/* Nom */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1" style={labelStyle}>
          Nom de l&apos;équipe
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="Équipe A"
        />
      </div>

      {/* Catégorie */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1" style={labelStyle}>
          Catégorie
        </label>
        <input
          id="category"
          name="category"
          type="text"
          required
          defaultValue={defaultValues?.category ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="Séniors, U17, Féminines…"
        />
      </div>

      {/* Saison */}
      <div>
        <label htmlFor="season" className="block text-sm font-medium mb-1" style={labelStyle}>
          Saison
        </label>
        <input
          id="season"
          name="season"
          type="text"
          required
          defaultValue={defaultValues?.season ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="2024-2025"
          pattern="\d{4}-\d{4}"
        />
        <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
          Format : 2024-2025
        </p>
      </div>

      {/* Erreur */}
      {!state.success && state.error && (
        <p
          className="text-sm px-3 py-2 rounded-lg"
          style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}
        >
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {pending ? 'Enregistrement…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors"
          style={{ border: '1px solid #e4e0ec', color: '#353148' }}
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
