'use client'

import { useTransition } from 'react'
import { registerForEvent, unregisterFromEvent } from '@/app/dashboard/associatif/actions'

interface Props {
  eventId: string
  isRegistered: boolean
}

export function RegisterButton({ eventId, isRegistered }: Props) {
  const [pending, startTransition] = useTransition()

  if (isRegistered) {
    return (
      <button
        onClick={() => {
          if (!confirm('Se désinscrire de cet événement ?')) return
          startTransition(async () => { await unregisterFromEvent(eventId) })
        }}
        disabled={pending}
        className="px-4 py-2 text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
        style={{ border: '1px solid #e4e0ec', color: '#353148' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8f6fc')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '')}
      >
        {pending ? '…' : '✓ Inscrit — Se désinscrire'}
      </button>
    )
  }

  return (
    <button
      onClick={() => startTransition(async () => { await registerForEvent(eventId) })}
      disabled={pending}
      className="px-4 py-2 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-opacity hover:opacity-90"
      style={{ backgroundColor: '#8c60f3' }}
    >
      {pending ? '…' : "S'inscrire à cet événement"}
    </button>
  )
}
