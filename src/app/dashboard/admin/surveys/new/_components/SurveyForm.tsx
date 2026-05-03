'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createSurvey } from '@/app/dashboard/surveys/actions'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false, error: '' }

export function SurveyForm() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(createSurvey, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/surveys')
    }
  }, [state.success, router])

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1.5" style={{ color: '#353148' }}>
          Question du sondage
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={500}
          placeholder="Ex : Serez-vous disponible pour le tournoi du 15 juin ?"
          className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
          style={{ border: '1px solid #d4c8f8', backgroundColor: '#fff', color: '#353148' }}
        />
        <p className="text-xs mt-1" style={{ color: '#8e8a9c' }}>
          Les licenciés pourront répondre Oui ou Non.
        </p>
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
          {isPending ? 'Création…' : 'Créer le sondage'}
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
