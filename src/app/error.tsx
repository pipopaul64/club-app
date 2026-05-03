'use client'

import { useEffect } from 'react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    // In production you'd send this to Sentry / Datadog
    console.error('[GlobalError]', error)
  }, [error])

  return (
    <html lang="fr">
      <body>
        <main
          className="min-h-screen flex items-center justify-center px-4"
          style={{ backgroundColor: '#f8f6fc' }}
        >
          <div className="text-center max-w-sm">
            <p className="text-5xl mb-4">⚠️</p>
            <h1 className="text-xl font-bold mb-2" style={{ color: '#353148' }}>
              Une erreur inattendue est survenue
            </h1>
            <p className="text-sm mb-6" style={{ color: '#8e8a9c' }}>
              Nos équipes ont été notifiées. Vous pouvez réessayer ou revenir plus tard.
            </p>
            <button
              onClick={reset}
              className="px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#8c60f3' }}
            >
              Réessayer
            </button>
          </div>
        </main>
      </body>
    </html>
  )
}
