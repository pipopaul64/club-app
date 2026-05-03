'use client'

import { useTransition } from 'react'
import { updateConvocationStatus } from '@/app/dashboard/convocations/actions'

type Props = {
  convocationId: string
  currentStatus: string
}

export function StatusButtons({ convocationId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleStatus(status: 'confirmed' | 'declined') {
    startTransition(async () => {
      await updateConvocationStatus(convocationId, status)
    })
  }

  if (currentStatus === 'confirmed') {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ color: '#166534', backgroundColor: '#dcfce7' }}
        >
          ✓ Confirmé
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatus('declined')}
          className="text-xs px-2 py-1 rounded-md transition-opacity disabled:opacity-40 hover:opacity-70"
          style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}
        >
          Décliner
        </button>
      </div>
    )
  }

  if (currentStatus === 'declined') {
    return (
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-medium px-2.5 py-1 rounded-full"
          style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}
        >
          ✗ Décliné
        </span>
        <button
          type="button"
          disabled={isPending}
          onClick={() => handleStatus('confirmed')}
          className="text-xs px-2 py-1 rounded-md transition-opacity disabled:opacity-40 hover:opacity-70"
          style={{ color: '#166534', backgroundColor: '#dcfce7' }}
        >
          Confirmer
        </button>
      </div>
    )
  }

  // pending
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleStatus('confirmed')}
        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-40"
        style={{ backgroundColor: '#166534', color: '#ffffff' }}
      >
        Confirmer
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() => handleStatus('declined')}
        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity disabled:opacity-40"
        style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}
      >
        Décliner
      </button>
    </div>
  )
}
