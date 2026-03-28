import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#f8f6fc' }}>
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold" style={{ color: '#353148' }}>ClubOS</h1>
        <p className="text-lg" style={{ color: '#8e8a9c' }}>La plateforme de gestion pour clubs sportifs amateurs</p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ backgroundColor: '#8c60f3' }}
          >
            Créer mon club
          </Link>
        </div>
      </div>
    </main>
  )
}
