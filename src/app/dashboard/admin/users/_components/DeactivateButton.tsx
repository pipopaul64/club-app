'use client'

import { useTransition } from 'react'
import { deactivateUser } from '@/app/dashboard/admin/actions'

export function DeactivateButton({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Désactiver ce licencié ? Il ne pourra plus se connecter.')) return
    startTransition(async () => {
      await deactivateUser(userId)
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-sm font-medium disabled:opacity-50 hover:underline"
      style={{ color: '#c0392b' }}
    >
      {pending ? 'Désactivation…' : 'Désactiver'}
    </button>
  )
}
