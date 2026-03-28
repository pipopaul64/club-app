'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'password' | 'magic-link'>('password')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (mode === 'magic-link') {
      const { error: err } = await authClient.signIn.magicLink({
        email,
        callbackURL: redirect,
      })
      if (err) {
        setError(err.message ?? 'Erreur lors de l\'envoi du lien')
      } else {
        setMessage('Lien de connexion envoyé ! Vérifiez votre email.')
      }
    } else {
      const { error: err } = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirect,
      })
      if (err) {
        setError(err.message ?? 'Identifiants incorrects')
      } else {
        router.push(redirect)
      }
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h1>
        <p className="text-gray-500 text-sm mb-6">Accédez à votre espace ClubOS</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="vous@exemple.com"
            />
          </div>

          {mode === 'password' && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {message && (
            <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">{message}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading
              ? 'Connexion…'
              : mode === 'magic-link'
              ? 'Envoyer le lien'
              : 'Se connecter'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'password' ? 'magic-link' : 'password')
              setError(null)
              setMessage(null)
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            {mode === 'password'
              ? 'Connexion par lien magique'
              : 'Connexion par mot de passe'}
          </button>
        </div>
      </div>
    </main>
  )
}
