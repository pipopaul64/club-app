import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#f8f6fc' }}
    >
      <div className="text-center max-w-sm">
        <p className="text-6xl font-bold mb-4" style={{ color: '#8c60f3' }}>404</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#353148' }}>
          Page introuvable
        </h1>
        <p className="text-sm mb-6" style={{ color: '#8e8a9c' }}>
          La page que vous cherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: '#8c60f3' }}
        >
          Retour au tableau de bord
        </Link>
      </div>
    </main>
  )
}
