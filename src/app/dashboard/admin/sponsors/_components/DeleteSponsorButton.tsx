'use client'

import { useTransition } from 'react'
import { deleteSponsor } from '@/app/dashboard/finance/actions'

export function DeleteSponsorButton({ sponsorId }: { sponsorId: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm('Supprimer ce sponsor ?')) return
    startTransition(async () => {
      await deleteSponsor(sponsorId)
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
