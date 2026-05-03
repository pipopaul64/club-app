'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPost } from '@/app/dashboard/admin/posts/actions'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false, error: '' }

export function PostForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createPost, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/posts')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-5">
      {/* Type */}
      <div>
        <label className="block text-sm font-medium mb-1.5" style={{ color: '#353148' }}>
          Type de publication
        </label>
        <div className="flex gap-4">
          {[
            { value: 'result', label: '🏆 Résultat', desc: 'Score d\'un match' },
            { value: 'news',   label: '📰 Actualité', desc: 'Info du club' },
          ].map(({ value, label, desc }) => (
            <label
              key={value}
              className="flex-1 flex items-start gap-3 rounded-xl p-4 cursor-pointer"
              style={{ border: '1px solid #d4c8f8', backgroundColor: '#f3f0ff' }}
            >
              <input
                type="radio"
                name="type"
                value={value}
                defaultChecked={value === 'result'}
                className="mt-0.5 accent-violet-500"
              />
              <div>
                <p className="text-sm font-medium" style={{ color: '#353148' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>{desc}</p>
              </div>
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
          placeholder="Ex : Victoire 3-1 face à l'AS Rival ! Buts : Dupont (2), Martin. Belle prestation collective…"
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none resize-none"
          style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff', color: '#353148' }}
        />
        <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>5000 caractères maximum</p>
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
          {isPending ? 'Publication…' : 'Publier'}
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
