'use client'

import { Suspense, useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
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
      const { error: err } = await authClient.signIn.magicLink({ email, callbackURL: redirect })
      if (err) {
        setError(err.message ?? "Erreur lors de l'envoi du lien")
      } else {
        setMessage('Lien de connexion envoyé ! Vérifiez votre email.')
      }
    } else {
      const { error: err } = await authClient.signIn.email({ email, password, callbackURL: redirect })
      if (err) {
        setError(err.message ?? 'Identifiants incorrects')
      } else {
        router.push(redirect)
      }
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-md rounded-xl p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}>
      <h1 className="text-2xl font-bold mb-1" style={{ color: '#353148' }}>Connexion</h1>
      <p className="text-sm mb-6" style={{ color: '#8e8a9c' }}>Accédez à votre espace ClubOS</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
            style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
            onFocus={e => (e.target.style.borderColor = '#8c60f3')}
            onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
            placeholder="vous@exemple.com"
          />
        </div>

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
              onFocus={e => (e.target.style.borderColor = '#8c60f3')}
              onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
              placeholder="••••••••"
            />
          </div>
        )}

        {error && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
            {error}
          </p>
        )}
        {message && (
          <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#1a7a4a', backgroundColor: '#f0faf4' }}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {loading ? 'Connexion…' : mode === 'magic-link' ? 'Envoyer le lien' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => { setMode(mode === 'password' ? 'magic-link' : 'password'); setError(null); setMessage(null) }}
          className="text-sm font-medium hover:underline"
          style={{ color: '#8c60f3' }}
        >
          {mode === 'password' ? 'Connexion par lien magique' : 'Connexion par mot de passe'}
        </button>
      </div>

      <p className="mt-4 text-center text-sm" style={{ color: '#8e8a9c' }}>
        Pas encore de compte ?{' '}
        <Link href="/register" className="font-medium hover:underline" style={{ color: '#8c60f3' }}>
          Créer mon club
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f8f6fc' }}>
      <Suspense fallback={<div style={{ color: '#8e8a9c' }}>Chargement…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
