'use client'

import { useTransition } from 'react'
import { togglePublish } from '@/app/dashboard/admin/posts/actions'

type Props = {
  postId: string
  isPublished: boolean
}

export function TogglePublishButton({ postId, isPublished }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    startTransition(async () => {
      await togglePublish(postId, !isPublished)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs px-2 py-1 rounded-md transition-opacity disabled:opacity-40 hover:opacity-70"
      style={
        isPublished
          ? { color: '#92400e', backgroundColor: '#fef3c7' }
          : { color: '#166534', backgroundColor: '#dcfce7' }
      }
    >
      {isPending ? '…' : isPublished ? 'Retirer' : 'Publier'}
    </button>
  )
}
