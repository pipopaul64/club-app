'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/types'

const initialState: ActionResult = { success: false, error: '' }

type Props = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  email:  string
}

export function RedeemForm({ action, email }: Props) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/onboarding')
    }
  }, [state.success, router])

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }
  const labelStyle = { color: '#353148' }

  return (
    <form action={formAction} className="space-y-5">
      {/* Email (verrouillé, vient de l'invitation) */}
      <div>
        <label className="block text-sm font-medium mb-1" style={labelStyle}>
          Email
        </label>
        <input
          type="email"
          value={email}
          readOnly
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ ...inputStyle, backgroundColor: '#f8f6fc' }}
        />
      </div>

      {/* Nom */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1" style={labelStyle}>
          Nom complet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e0ec')}
          placeholder="Jean Dupont"
        />
      </div>

      {/* Mot de passe */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1" style={labelStyle}>
          Mot de passe
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e0ec')}
          placeholder="8 caractères minimum"
        />
      </div>

      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full px-5 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50"
        style={{ backgroundColor: '#8c60f3' }}
      >
        {pending ? 'Création du compte…' : 'Créer mon compte'}
      </button>
    </form>
  )
}
