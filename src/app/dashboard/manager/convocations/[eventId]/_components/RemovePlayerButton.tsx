'use client'

import { useTransition } from 'react'
import { removeFromConvocation } from '@/app/dashboard/convocations/actions'

type Props = {
  convocationId: string
}

export function RemovePlayerButton({ convocationId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Retirer ce joueur de la convocation ?')) return
    startTransition(async () => {
      await removeFromConvocation(convocationId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md transition-opacity disabled:opacity-40 hover:opacity-70"
      style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}
    >
      {isPending ? '…' : 'Retirer'}
    </button>
  )
}
