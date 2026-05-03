'use client'

import { useTransition } from 'react'
import { updateCotisationStatus } from '@/app/dashboard/finance/actions'
import type { CotisationStatus } from '@/db/schema'

const STATUS_CONFIG: Record<CotisationStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  paid:    { label: 'Payé',       color: '#166534', bg: '#dcfce7' },
  late:    { label: 'En retard',  color: '#991b1b', bg: '#fee2e2' },
}

const NEXT_STATUS: Record<CotisationStatus, CotisationStatus> = {
  pending: 'paid',
  paid:    'late',
  late:    'pending',
}

interface Props {
  cotisationId: string
  currentStatus: CotisationStatus
}

export function UpdateCotisationStatusButton({ cotisationId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()
  const cfg = STATUS_CONFIG[currentStatus]

  const handleClick = () => {
    startTransition(async () => {
      await updateCotisationStatus(cotisationId, NEXT_STATUS[currentStatus])
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      title="Cliquer pour changer le statut"
      className="text-xs font-medium px-2 py-0.5 rounded-full transition-opacity hover:opacity-70 disabled:opacity-40"
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
    >
      {isPending ? '…' : cfg.label}
    </button>
  )
}
