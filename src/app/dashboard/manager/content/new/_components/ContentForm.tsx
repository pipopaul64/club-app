'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createMessage } from '@/app/dashboard/content/actions'
import type { ActionResult } from '@/types'

type Team = {
  id: string
  name: string
}

type Props = {
  teams: Team[]
  isAdmin: boolean
  defaultTeamId?: string
}

const initialState: ActionResult = { success: false, error: '' }

export function ContentForm({ teams, isAdmin, defaultTeamId }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createMessage, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/manager/content')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-5">
      {/* Sélection d'équipe */}
      <div>
        <label
          htmlFor="teamId"
          className="block text-sm font-medium mb-1.5"
          style={{ color: '#353148' }}
        >
          Équipe destinataire{' '}
          {isAdmin && (
            <span className="font-normal" style={{ color: '#8e8a9c' }}>
              (laisser vide pour un message club-wide)
            </span>
          )}
        </label>
        <select
          id="teamId"
          name="teamId"
          defaultValue={defaultTeamId ?? ''}
          className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none"
          style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff', color: '#353148' }}
        >
          {isAdmin && (
            <option value="">🌐 Tout le club</option>
          )}
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {/* Contenu */}
      <div>
        <label
          htmlFor="content"
          className="block text-sm font-medium mb-1.5"
          style={{ color: '#353148' }}
        >
          Message
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          placeholder="Écrivez votre message ici…"
          required
          maxLength={2000}
          className="w-full px-3 py-2 rounded-xl text-sm focus:outline-none resize-none"
          style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff', color: '#353148' }}
        />
        <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
          2000 caractères maximum
        </p>
      </div>

      {/* Feedback */}
      {!state.success && state.error && (
        <p
          className="text-sm px-3 py-2 rounded-lg"
          style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}
        >
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {isPending ? 'Publication…' : 'Publier le message'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: '1px solid #e4e0ec', color: '#8e8a9c' }}
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
