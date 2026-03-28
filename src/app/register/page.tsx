'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerClub } from '@/app/actions/register'
import { authClient } from '@/lib/auth-client'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const result = await registerClub(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    const { error: signInError } = await authClient.signIn.email({
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    })

    if (signInError) {
      router.push('/login')
      return
    }

    router.push(result.data.redirect)
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f8f6fc' }}>
      <div className="w-full max-w-md rounded-xl p-8" style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}>

        <h1 className="text-2xl font-bold mb-1" style={{ color: '#353148' }}>Créer votre club</h1>
        <p className="text-sm mb-6" style={{ color: '#8e8a9c' }}>
          Vous serez administrateur de votre espace ClubOS.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom du club */}
          <div>
            <label htmlFor="clubName" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
              Nom du club
            </label>
            <input
              id="clubName"
              name="clubName"
              type="text"
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
              onFocus={e => (e.target.style.borderColor = '#8c60f3')}
              onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
              placeholder="AS Saint-Étienne"
            />
          </div>

          {/* Prénom + Nom sur la même ligne */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
                onFocus={e => (e.target.style.borderColor = '#8c60f3')}
                onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
                placeholder="Jean"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
                onFocus={e => (e.target.style.borderColor = '#8c60f3')}
                onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
                placeholder="Dupont"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
              onFocus={e => (e.target.style.borderColor = '#8c60f3')}
              onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
              placeholder="vous@exemple.com"
            />
          </div>

          {/* Mot de passe */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1" style={{ color: '#353148' }}>
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
              style={{ border: '1px solid #e4e0ec', color: '#353148', backgroundColor: '#ffffff' }}
              onFocus={e => (e.target.style.borderColor = '#8c60f3')}
              onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
              placeholder="8 caractères minimum"
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-50"
            style={{ backgroundColor: '#8c60f3' }}
          >
            {loading ? 'Création en cours…' : 'Créer mon club'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm" style={{ color: '#8e8a9c' }}>
          Déjà un compte ?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#8c60f3' }}>
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  )
}
