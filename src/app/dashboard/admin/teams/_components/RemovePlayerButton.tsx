'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removePlayerFromTeam } from '@/app/dashboard/admin/actions'

type Props = {
  teamId: string
  userId: string
  playerName: string
}

export function RemovePlayerButton({ teamId, userId, playerName }: Props) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (!confirm(`Retirer ${playerName} de l'équipe ?`)) return

    startTransition(async () => {
      await removePlayerFromTeam(teamId, userId)
      router.refresh()
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs font-medium disabled:opacity-50 hover:underline"
      style={{ color: '#c0392b' }}
    >
      {pending ? 'Retrait…' : 'Retirer'}
    </button>
  )
}
