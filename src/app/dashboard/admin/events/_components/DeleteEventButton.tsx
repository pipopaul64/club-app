'use client'

import { useTransition } from 'react'
import { deleteEvent } from '@/app/dashboard/events/actions'

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      onClick={() => {
        if (!confirm('Supprimer cet événement ? Cette action est irréversible.')) return
        startTransition(async () => { await deleteEvent(eventId) })
      }}
      disabled={pending}
      className="text-xs font-medium hover:underline disabled:opacity-50 transition-opacity"
      style={{ color: '#c0392b' }}
    >
      {pending ? '…' : 'Supprimer'}
    </button>
  )
}
