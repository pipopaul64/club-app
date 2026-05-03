'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false, error: '' }

type Team = { id: string; name: string; category: string; season: string }

type Props = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  isManager:             boolean
  availableTeams:        Team[]
  defaultMemberTeamIds:  string[]
  defaultManagerTeamIds: string[]
}

export function OnboardingForm({
  action,
  isManager,
  availableTeams,
  defaultMemberTeamIds,
  defaultManagerTeamIds,
}: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) router.push('/dashboard')
  }, [state.success, router])

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }
  const labelStyle = { color: '#353148' }

  return (
    <form action={formAction} className="space-y-6">
      {/* Profil optionnel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1" style={labelStyle}>
            Téléphone <span style={{ color: '#8e8a9c' }}>(optionnel)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8c60f3')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e0ec')}
            placeholder="+33 6 00 00 00 00"
          />
        </div>
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium mb-1" style={labelStyle}>
            Date de naissance <span style={{ color: '#8e8a9c' }}>(optionnel)</span>
          </label>
          <input
            id="birthDate"
            name="birthDate"
            type="date"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={inputStyle}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#8c60f3')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e0ec')}
          />
        </div>
      </div>

      {/* Équipes managées (si manager) */}
      {isManager && (
        <TeamPicker
          legend="Équipes que je gère"
          help="Sélectionnez au moins une équipe."
          name="teamManagerIds"
          teams={availableTeams}
          defaultSelected={defaultManagerTeamIds}
        />
      )}

      {/* Équipes où je joue */}
      <TeamPicker
        legend={isManager ? 'Équipes où je joue (optionnel)' : 'Équipes auxquelles j\'appartiens'}
        help={
          isManager
            ? 'Laissez vide si vous n\'êtes pas joueur.'
            : 'Sélectionnez au moins une équipe.'
        }
        name="teamMemberIds"
        teams={availableTeams}
        defaultSelected={defaultMemberTeamIds}
      />

      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-5 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {pending ? 'Enregistrement…' : 'Continuer vers mon tableau de bord'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// TeamPicker — checkbox list groupée par catégorie
// ---------------------------------------------------------------------------
function TeamPicker({
  legend,
  help,
  name,
  teams,
  defaultSelected,
}: {
  legend: string
  help: string
  name: string
  teams: Team[]
  defaultSelected: string[]
}) {
  const selected = new Set(defaultSelected)

  return (
    <fieldset>
      <legend className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
        {legend}
      </legend>
      <p className="text-xs mb-2" style={{ color: '#8e8a9c' }}>{help}</p>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {teams.map((t) => (
          <label
            key={t.id}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
            style={{ border: '1px solid #e4e0ec', backgroundColor: '#ffffff' }}
          >
            <input
              type="checkbox"
              name={name}
              value={t.id}
              defaultChecked={selected.has(t.id)}
              style={{ accentColor: '#8c60f3' }}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium" style={{ color: '#353148' }}>{t.name}</p>
              <p className="text-xs" style={{ color: '#8e8a9c' }}>
                {t.category} · Saison {t.season}
              </p>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
