'use client'

import { useTransition } from 'react'
import { respondToSurvey } from '@/app/dashboard/surveys/actions'

type Props = {
  surveyId: string
  currentAnswer?: 'yes' | 'no'
}

export function SurveyResponseButtons({ surveyId, currentAnswer }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleRespond(value: 'yes' | 'no') {
    startTransition(async () => {
      await respondToSurvey(surveyId, value)
    })
  }

  return (
    <div className="flex items-center gap-3 mt-3 pt-3" style={{ borderTop: '1px solid #f0eef8' }}>
      <button
        type="button"
        onClick={() => handleRespond('yes')}
        disabled={isPending}
        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
        style={
          currentAnswer === 'yes'
            ? { backgroundColor: '#166534', color: '#ffffff' }
            : { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
        }
      >
        {currentAnswer === 'yes' ? '✓ Oui' : 'Oui'}
      </button>
      <button
        type="button"
        onClick={() => handleRespond('no')}
        disabled={isPending}
        className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-60"
        style={
          currentAnswer === 'no'
            ? { backgroundColor: '#991b1b', color: '#ffffff' }
            : { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
        }
      >
        {currentAnswer === 'no' ? '✗ Non' : 'Non'}
      </button>
    </div>
  )
}
