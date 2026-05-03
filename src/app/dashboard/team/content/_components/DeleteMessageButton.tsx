'use client'

import { useTransition } from 'react'
import { deleteMessage } from '@/app/dashboard/content/actions'

type Props = {
  messageId: string
}

export function DeleteMessageButton({ messageId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Supprimer ce message ?')) return
    startTransition(async () => {
      await deleteMessage(messageId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="shrink-0 text-xs px-2 py-1 rounded-md transition-opacity disabled:opacity-40 hover:opacity-70"
      style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}
    >
      {isPending ? '…' : 'Supprimer'}
    </button>
  )
}
