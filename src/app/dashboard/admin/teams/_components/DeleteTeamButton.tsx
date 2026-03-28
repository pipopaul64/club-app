'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTeam } from '@/app/dashboard/admin/actions'

export function DeleteTeamButton({ teamId }: { teamId: string }) {
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  function handleClick() {
    if (
      !confirm(
        'Supprimer cette équipe définitivement ? Les joueurs seront retirés. Cette action est irréversible.',
      )
    )
      return

    startTransition(async () => {
      await deleteTeam(teamId)
      router.push('/dashboard/admin/teams')
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm font-medium disabled:opacity-50 hover:underline"
      style={{ color: '#c0392b' }}
    >
      {pending ? 'Suppression…' : 'Supprimer'}
    </button>
  )
}
