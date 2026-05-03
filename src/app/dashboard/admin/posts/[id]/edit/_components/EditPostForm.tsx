'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updatePost } from '@/app/dashboard/admin/posts/actions'
import type { ActionResult } from '@/types'

type Post = {
  id: string
  type: string
  content: string
  publishedAt: Date | null
}

type Props = {
  post: Post
}

const initialState: ActionResult = { success: false, error: '' }

export function EditPostForm({ post }: Props) {
  const router = useRouter()
  const updatePostBound = updatePost.bind(null, post.id)
  const [state, formAction, isPending] = useActionState(updatePostBound, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/posts')
    }
  }, [state.success, router])

  const isPublished = post.publishedAt !== null

  return (
    <form action={formAction} className="space-y-5">
      {/* Statut publication */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          backgroundColor: isPublished ? '#dcfce7' : '#fef3c7',
          border: `1px solid ${isPublished ? '#bbf7d0' : '#fde68a'}`,
        }}
      >
        <span className="text-sm font-medium" style={{ color: isPublished ? '#166534' : '#92400e' }}>
          {isPublished ? '✓ Publiée' : '⏸ Brouillon'}
        </span>
        <div className="ml-auto flex gap-2">
          {isPublished ? (
            <button
              type="submit"
              name="publishAction"
              value="unpublish"
              disabled={isPending}
              className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity disabled:opacity-60"
              style={{ color: '#92400e', backgroundColor: '#fef3c7', border: '1px solid #fde68a' }}
            >
              Retirer de la vitrine
            </button>
          ) : (
            <button
              type="submit"
              name="publishAction"
              value="publish"
              disabled={isPending}
              className="text-xs px-3 py-1 rounded-lg font-medium transition-opacity disabled:opacity-60"
              style={{ color: '#166534', backgroundColor: '#dcfce7', border: '1px solid #bbf7d0' }}
            >
              Publier
            </button>
          )}
        </div>
      </div>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#353148' }}>
          Type de publication
        </label>
        <div className="flex gap-4">
          {[
            { value: 'result', label: '🏆 Résultat' },
            { value: 'news',   label: '📰 Actualité' },
          ].map(({ value, label }) => (
            <label
              key={value}
              className="flex items-center gap-2 rounded-xl px-4 py-3 cursor-pointer flex-1"
              style={{ border: '1px solid #d4c8f8', backgroundColor: '#f3f0ff' }}
            >
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={post.type === value}
                className="accent-violet-500"
              />
              <span className="text-sm font-medium" style={{ color: '#353148' }}>{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-1.5" style={{ color: '#353148' }}>
          Contenu
        </label>
        <textarea
          id="content"
          name="content"
          rows={6}
          required
          maxLength={5000}
          defaultValue={post.content}
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
          style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff', color: '#353148' }}
        />
      </div>

      {/* Feedback */}
      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: '1px solid #e4e0ec', color: '#8e8a9c' }}
        >
          Annuler
        </button>
      </div>
    </form>
  )
}
