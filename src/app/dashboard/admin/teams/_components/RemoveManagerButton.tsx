'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { removeManagerFromTeam } from '@/app/dashboard/admin/actions'

type Props = { teamId: string; managerId: string; managerName: string }

export function RemoveManagerButton({ teamId, managerId, managerName }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!confirm(`Retirer ${managerName} du staff de cette équipe ?`)) return
    startTransition(async () => {
      const res = await removeManagerFromTeam(teamId, managerId)
      if (!res.success) alert(res.error)
      else router.refresh()
    })
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-xs font-medium hover:underline disabled:opacity-50"
      style={{ color: '#c0392b' }}
    >
      {pending ? '…' : 'Retirer'}
    </button>
  )
}
