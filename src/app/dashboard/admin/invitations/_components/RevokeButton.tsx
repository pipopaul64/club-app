'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { revokeInvitation } from '../actions'

type Props = { invitationId: string; email: string }

export function RevokeButton({ invitationId, email }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function onClick() {
    if (!confirm(`Révoquer l'invitation envoyée à ${email} ?`)) return
    startTransition(async () => {
      const res = await revokeInvitation(invitationId)
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
      {pending ? '…' : 'Révoquer'}
    </button>
  )
}
