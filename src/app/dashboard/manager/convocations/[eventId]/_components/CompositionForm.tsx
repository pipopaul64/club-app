'use client'

import { useActionState } from 'react'
import { updateComposition } from '@/app/dashboard/convocations/actions'
import type { ActionResult } from '@/types'

type Convocation = {
  id: string
  userId: string
  isStarter: boolean | null
  status: string
  user: { id: string; name: string | null }
}

type Props = {
  eventId: string
  convocations: Convocation[]
}

const initialState: ActionResult = { success: false, error: '' }

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  confirmed: { label: 'Confirmé',   color: '#166534', bg: '#dcfce7' },
  declined:  { label: 'Décliné',    color: '#991b1b', bg: '#fee2e2' },
}

export function CompositionForm({ eventId, convocations }: Props) {
  const updateCompositionBound = updateComposition.bind(null, eventId)
  const [state, formAction, isPending] = useActionState(
    updateCompositionBound,
    initialState,
  )

  return (
    <form action={formAction} className="space-y-2">
      {convocations.map((conv) => {
        const statusCfg = STATUS_LABELS[conv.status] ?? STATUS_LABELS.pending

        return (
          <div
            key={conv.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{ border: '1px solid #e4e0ec', backgroundColor: '#fafafa' }}
          >
            {/* Nom + statut */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#353148' }}>
                {conv.user.name ?? '?'}
              </p>
              <span
                className="text-xs font-medium px-1.5 py-0.5 rounded-full"
                style={{ color: statusCfg.color, backgroundColor: statusCfg.bg }}
              >
                {statusCfg.label}
              </span>
            </div>

            {/* Composition : radio titulaire / remplaçant / non assigné */}
            <div className="flex items-center gap-4 text-xs shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`pos_${conv.userId}`}
                  value="starter"
                  defaultChecked={conv.isStarter === true}
                  className="accent-violet-500"
                />
                <span style={{ color: '#353148' }}>Titulaire</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`pos_${conv.userId}`}
                  value="substitute"
                  defaultChecked={conv.isStarter === false}
                  className="accent-violet-500"
                />
                <span style={{ color: '#353148' }}>Remplaçant</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`pos_${conv.userId}`}
                  value=""
                  defaultChecked={conv.isStarter === null}
                  className="accent-violet-500"
                />
                <span style={{ color: '#8e8a9c' }}>—</span>
              </label>
            </div>
          </div>
        )
      })}

      {/* Feedback */}
      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#166534', backgroundColor: '#dcfce7' }}>
          Composition enregistrée ✓
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer la composition'}
      </button>
    </form>
  )
}
