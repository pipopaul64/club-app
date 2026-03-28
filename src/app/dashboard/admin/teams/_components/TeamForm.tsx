'use client'

import { useActionState, useEffect, useState } from 'react'
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
  existingCategories: string[]
  submitLabel: string
  cancelHref: string
}

const initialState: ActionResult = { success: false, error: '' }

export function TeamForm({
  action,
  defaultValues,
  existingCategories,
  submitLabel,
  cancelHref,
}: TeamFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  const defaultCategory = defaultValues?.category ?? ''

  // Mode custom si : aucune catégorie existante, ou si la catégorie actuelle
  // n'est pas dans la liste (ex : modif d'une équipe avec catégorie unique)
  const isInList = existingCategories.includes(defaultCategory)
  const [isCustom, setIsCustom] = useState(!!defaultCategory && !isInList)
  const [customValue, setCustomValue] = useState(!isInList ? defaultCategory : '')

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

        {isCustom ? (
          <div className="space-y-1.5">
            <input
              id="category"
              name="category"
              type="text"
              required
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
              onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
              placeholder="Ex : Séniors, U17, Féminines…"
            />
            {existingCategories.length > 0 && (
              <button
                type="button"
                onClick={() => { setIsCustom(false); setCustomValue('') }}
                className="text-xs hover:underline"
                style={{ color: '#8e8a9c' }}
              >
                ← Choisir dans la liste
              </button>
            )}
          </div>
        ) : (
          <select
            id="category"
            name="category"
            required
            defaultValue={isInList ? defaultCategory : ''}
            onChange={(e) => {
              if (e.target.value === '__add__') {
                setIsCustom(true)
                setCustomValue('')
              }
            }}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
            onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
          >
            <option value="" disabled>
              Sélectionner une catégorie…
            </option>
            {existingCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__add__">+ Ajouter une catégorie</option>
          </select>
        )}
      </div>

      {/* Saison */}
      <div>
        <label htmlFor="season" className="block text-sm font-medium mb-1" style={labelStyle}>
          Saison
        </label>
        <select
          id="season"
          name="season"
          required
          defaultValue={defaultValues?.season ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.target.style.borderColor = '#e4e0ec')}
        >
          <option value="" disabled>
            Sélectionner une saison…
          </option>
          {Array.from({ length: 3 }, (_, i) => {
            const year = new Date().getFullYear() - 1 + i
            const season = `${year}-${year + 1}`
            return (
              <option key={season} value={season}>
                {season}
              </option>
            )
          })}
        </select>
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
