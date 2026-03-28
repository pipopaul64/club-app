import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">ClubOS</h1>
        <p className="text-gray-500 text-lg">La plateforme de gestion pour clubs sportifs amateurs</p>
        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-6 py-2.5 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Créer mon club
          </Link>
        </div>
      </div>
    </main>
  )
}
