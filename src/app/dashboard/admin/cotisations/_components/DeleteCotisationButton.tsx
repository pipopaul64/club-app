'use client'

import { useTransition } from 'react'
import { deleteCotisation } from '@/app/dashboard/finance/actions'

export function DeleteCotisationButton({ cotisationId }: { cotisationId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('Supprimer cette cotisation ?')) return
    startTransition(async () => {
      await deleteCotisation(cotisationId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md transition-opacity hover:opacity-70 disabled:opacity-40"
      style={{ color: '#991b1b', backgroundColor: '#fee2e2' }}
    >
      {isPending ? '…' : 'Supprimer'}
    </button>
  )
}
