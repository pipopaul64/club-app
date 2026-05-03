'use client'

import { useTransition } from 'react'
import { deleteSurvey } from '@/app/dashboard/surveys/actions'

type Props = {
  surveyId: string
}

export function DeleteSurveyButton({ surveyId }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    if (!confirm('Supprimer ce sondage et toutes ses réponses ?')) return
    startTransition(async () => {
      await deleteSurvey(surveyId)
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
