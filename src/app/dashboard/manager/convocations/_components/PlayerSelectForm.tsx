'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createConvocation } from '@/app/dashboard/convocations/actions'
import type { ActionResult } from '@/types'

type Player = { id: string; name: string | null }

type Props = {
  eventId: string
  players: Player[]
}

const initialState: ActionResult<{ eventId: string }> = { success: false, error: '' }

export function PlayerSelectForm({ eventId, players }: Props) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createConvocation, initialState)

  useEffect(() => {
    if (state.success && state.data?.eventId) {
      router.push(`/dashboard/manager/convocations/${state.data.eventId}`)
    }
  }, [state, router])

  if (players.length === 0) {
    return (
      <p className="text-sm text-center py-4" style={{ color: '#8e8a9c' }}>
        Tous les membres de l&apos;équipe sont déjà convoqués pour cet événement.
      </p>
    )
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />

      {/* Liste de joueurs */}
      <div className="space-y-2">
        {players.map((player) => (
          <label
            key={player.id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors hover:opacity-90"
            style={{ border: '1px solid #e4e0ec', backgroundColor: '#fafafa' }}
          >
            <input
              type="checkbox"
              name="userIds"
              value={player.id}
              className="w-4 h-4 accent-violet-500"
            />
            <span className="text-sm font-medium" style={{ color: '#353148' }}>
              {player.name ?? '?'}
            </span>
          </label>
        ))}
      </div>

      {/* Sélectionner tout */}
      <button
        type="button"
        className="text-xs underline"
        style={{ color: '#8c60f3' }}
        onClick={() => {
          const form = document.querySelector('form')
          const checkboxes = form?.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')
          checkboxes?.forEach((cb) => { cb.checked = true })
        }}
      >
        Tout sélectionner
      </button>

      {/* Erreur */}
      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {isPending ? 'Convocation en cours…' : 'Convoquer les joueurs sélectionnés'}
      </button>
    </form>
  )
}
