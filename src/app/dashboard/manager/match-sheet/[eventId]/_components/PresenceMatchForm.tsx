'use client'

import { useActionState, useState } from 'react'
import { saveMatchSheet } from '@/app/dashboard/match-sheet/actions'
import type { ActionResult } from '@/types'
import type { SheetPlayer } from '@/app/dashboard/match-sheet/actions'

type Props = {
  eventId: string
  players: SheetPlayer[]
  isMatch: boolean
}

const initialState: ActionResult = { success: false, error: '' }

export function PresenceMatchForm({ eventId, players, isMatch }: Props) {
  const saveMatchSheetBound = saveMatchSheet.bind(null, eventId)
  const [state, formAction, isPending] = useActionState(saveMatchSheetBound, initialState)

  // Tracks checkbox state locally to toggle stats visibility
  const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>(
    Object.fromEntries(players.map((p) => [p.userId, p.present ?? false])),
  )

  return (
    <form action={formAction} className="space-y-2">
      {players.map((player) => {
        const isPresent = presenceMap[player.userId] ?? false
        const posLabel =
          player.isStarter === true
            ? '👕 Titulaire'
            : player.isStarter === false
            ? '🔄 Remplaçant'
            : null

        return (
          <div
            key={player.userId}
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid #e4e0ec' }}
          >
            {/* Ligne présence */}
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                id={`present_${player.userId}`}
                name={`present_${player.userId}`}
                checked={isPresent}
                onChange={(e) =>
                  setPresenceMap((prev) => ({
                    ...prev,
                    [player.userId]: e.target.checked,
                  }))
                }
                className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
              />
              <label
                htmlFor={`present_${player.userId}`}
                className="flex-1 flex items-center gap-2 cursor-pointer"
              >
                <span className="text-sm font-medium" style={{ color: '#353148' }}>
                  {player.name}
                </span>
                {posLabel && (
                  <span className="text-xs" style={{ color: '#8c60f3' }}>
                    {posLabel}
                  </span>
                )}
              </label>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={
                  isPresent
                    ? { color: '#166534', backgroundColor: '#dcfce7' }
                    : { color: '#8e8a9c', backgroundColor: '#f3f0ff' }
                }
              >
                {isPresent ? 'Présent' : 'Absent'}
              </span>
            </div>

            {/* Stats (matchs uniquement, joueur présent) */}
            {isMatch && isPresent && (
              <div
                className="px-4 pb-4 pt-3 grid grid-cols-2 gap-3 sm:grid-cols-4"
                style={{ borderTop: '1px solid #f0eef8', backgroundColor: '#fafafa' }}
              >
                <div>
                  <label
                    htmlFor={`goals_${player.userId}`}
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#8e8a9c' }}
                  >
                    ⚽ Buts
                  </label>
                  <input
                    type="number"
                    id={`goals_${player.userId}`}
                    name={`goals_${player.userId}`}
                    defaultValue={player.stats?.goals ?? 0}
                    min={0}
                    className="w-full px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                    style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff' }}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`assists_${player.userId}`}
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#8e8a9c' }}
                  >
                    🎯 Passes déc.
                  </label>
                  <input
                    type="number"
                    id={`assists_${player.userId}`}
                    name={`assists_${player.userId}`}
                    defaultValue={player.stats?.assists ?? 0}
                    min={0}
                    className="w-full px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                    style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff' }}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`minutes_${player.userId}`}
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#8e8a9c' }}
                  >
                    ⏱ Minutes
                  </label>
                  <input
                    type="number"
                    id={`minutes_${player.userId}`}
                    name={`minutes_${player.userId}`}
                    defaultValue={player.stats?.minutesPlayed ?? 0}
                    min={0}
                    max={200}
                    className="w-full px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                    style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff' }}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`rating_${player.userId}`}
                    className="block text-xs font-medium mb-1"
                    style={{ color: '#8e8a9c' }}
                  >
                    ⭐ Note /10
                  </label>
                  <input
                    type="number"
                    id={`rating_${player.userId}`}
                    name={`rating_${player.userId}`}
                    defaultValue={player.stats?.rating ?? 0}
                    min={0}
                    max={10}
                    step={0.5}
                    className="w-full px-3 py-1.5 rounded-lg text-sm focus:outline-none"
                    style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff' }}
                  />
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Feedback */}
      {!state.success && state.error && (
        <p
          className="text-sm px-3 py-2 rounded-lg"
          style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          className="text-sm px-3 py-2 rounded-lg"
          style={{ color: '#166534', backgroundColor: '#dcfce7' }}
        >
          Feuille enregistrée ✓
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer la feuille'}
      </button>
    </form>
  )
}
