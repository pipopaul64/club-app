'use client'

import { useEffect } from 'react'
import Link from 'next/link'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[DashboardError]', error)
  }, [error])

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-4 py-16 text-center"
      style={{ backgroundColor: '#f8f6fc' }}
    >
      <p className="text-4xl mb-4">⚠️</p>
      <h2 className="text-lg font-bold mb-2" style={{ color: '#353148' }}>
        Quelque chose s&apos;est mal passé
      </h2>
      <p className="text-sm mb-6 max-w-xs" style={{ color: '#8e8a9c' }}>
        Une erreur inattendue est survenue sur cette page.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#8c60f3' }}
        >
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          style={{ border: '1px solid #e4e0ec', color: '#353148' }}
        >
          Tableau de bord
        </Link>
      </div>
    </div>
  )
}
