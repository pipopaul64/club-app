'use client'

import { useActionState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

const EVENT_TYPE_LABELS = {
  match: 'Match',
  training: 'Entraînement',
  other: 'Autre',
} as const

type Team = { id: string; name: string }

type EventFormValues = {
  title?: string
  type?: string
  date?: string       // format ISO datetime-local : 'YYYY-MM-DDTHH:mm'
  location?: string
  teamId?: string | null
}

type EventFormProps = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  defaultValues?: EventFormValues
  teams: Team[]
  requireTeam?: boolean   // Manager Sportif doit choisir une équipe
  submitLabel: string
  cancelHref: string
}

const initialState: ActionResult = { success: false, error: '' }

export function EventForm({
  action,
  defaultValues,
  teams,
  requireTeam = false,
  submitLabel,
  cancelHref,
}: EventFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/calendar')
    }
  }, [state.success, router])

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }

  const labelStyle = { color: '#353148' }

  // Convertir une date DB en valeur datetime-local ('YYYY-MM-DDTHH:mm')
  const defaultDateValue = defaultValues?.date
    ? new Date(defaultValues.date).toISOString().slice(0, 16)
    : ''

  return (
    <form action={formAction} className="space-y-5">
      {/* Titre */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1" style={labelStyle}>
          Titre
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="Match contre FC Exemple"
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1" style={labelStyle}>
          Type
        </label>
        <select
          id="type"
          name="type"
          required
          defaultValue={defaultValues?.type ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
        >
          <option value="" disabled>
            Sélectionner un type…
          </option>
          {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Date et heure */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium mb-1" style={labelStyle}>
          Date et heure
        </label>
        <input
          id="date"
          name="date"
          type="datetime-local"
          required
          defaultValue={defaultDateValue}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
        />
      </div>

      {/* Lieu */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium mb-1" style={labelStyle}>
          Lieu <span style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          defaultValue={defaultValues?.location ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="Stade Municipal, Salle B…"
        />
      </div>

      {/* Équipe */}
      <div>
        <label htmlFor="teamId" className="block text-sm font-medium mb-1" style={labelStyle}>
          Équipe{' '}
          {!requireTeam && <span style={{ color: '#8e8a9c' }}>(optionnel — laisser vide pour tout le club)</span>}
        </label>
        {teams.length === 0 ? (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#8e8a9c', backgroundColor: '#f8f6fc' }}>
            Aucune équipe disponible.
          </p>
        ) : (
          <select
            id="teamId"
            name="teamId"
            required={requireTeam}
            defaultValue={defaultValues?.teamId ?? ''}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
            onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          >
            {!requireTeam && <option value="">— Tout le club —</option>}
            {requireTeam && (
              <option value="" disabled>
                Sélectionner une équipe…
              </option>
            )}
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
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
