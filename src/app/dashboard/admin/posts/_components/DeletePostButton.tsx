'use client'

import { useTransition } from 'react'
import { deletePost } from '@/app/dashboard/admin/posts/actions'

type Props = {
  postId: string
}

export function DeletePostButton({ postId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Supprimer cette publication définitivement ?')) return
    startTransition(async () => {
      await deletePost(postId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md transition-opacity disabled:opacity-40 hover:opacity-70"
      style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}
    >
      {isPending ? '…' : 'Supprimer'}
    </button>
  )
}
