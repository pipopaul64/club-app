'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import type { ActionResult } from '@/types'

type CreateInviteResult = ActionResult<{ inviteUrl: string }>
const initialState: CreateInviteResult = { success: false, error: '' }

type Props = {
  action: (prev: CreateInviteResult, formData: FormData) => Promise<CreateInviteResult>
}

export function InvitationForm({ action }: Props) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const [copied, setCopied] = useState(false)

  const inputStyle = {
    border: '1px solid #e4e0ec',
    color: '#353148',
    backgroundColor: '#ffffff',
  }
  const labelStyle = { color: '#353148' }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Copiez le lien :', url)
    }
  }

  if (state.success) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-lg p-4 text-sm"
          style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46' }}
        >
          ✓ Invitation envoyée. Le lien a aussi été copié ci-dessous au cas où l&apos;email tarde.
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: '#8e8a9c' }}>
            Lien d&apos;invitation (à usage unique)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={state.data.inviteUrl}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-mono outline-none"
              style={inputStyle}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={() => copy(state.data.inviteUrl)}
              className="px-3 py-2 text-xs font-medium rounded-lg text-white"
              style={{ backgroundColor: '#8c60f3' }}
            >
              {copied ? '✓ Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard/admin/invitations"
            className="px-5 py-2.5 text-sm font-medium rounded-lg text-white"
            style={{ backgroundColor: '#8c60f3' }}
          >
            Voir les invitations
          </Link>
          <Link
            href="/dashboard/admin/invitations/new"
            className="px-5 py-2.5 text-sm font-medium rounded-lg"
            style={{ border: '1px solid #e4e0ec', color: '#353148' }}
          >
            En envoyer une autre
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1" style={labelStyle}>
          Email du licencié
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={(e) => (e.currentTarget.style.borderColor = '#8c60f3')}
          onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e0ec')}
          placeholder="jean@exemple.com"
        />
      </div>

      {/* Rôle proposé */}
      <fieldset>
        <legend className="block text-sm font-medium mb-1" style={labelStyle}>
          Rôle proposé
        </legend>
        <p className="text-xs mb-2" style={{ color: '#8e8a9c' }}>
          Le rôle <strong>Manager</strong> permet en plus de gérer une ou plusieurs équipes.
          Pour donner les droits Admin, modifiez le licencié après son arrivée.
        </p>
        <div className="space-y-2">
          {([
            { value: 'user',    label: 'Licencié',        desc: 'Choisira ses équipes à la connexion' },
            { value: 'manager', label: 'Manager',         desc: 'Choisira aussi les équipes qu\'il gère' },
          ] as const).map(({ value, label, desc }, i) => (
            <label
              key={value}
              className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors"
              style={{ border: '1px solid #e4e0ec', backgroundColor: '#ffffff' }}
            >
              <input
                type="radio"
                name="invitedRole"
                value={value}
                required
                defaultChecked={i === 0}
                className="mt-0.5"
                style={{ accentColor: '#8c60f3' }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium" style={{ color: '#353148' }}>{label}</p>
                <p className="text-xs" style={{ color: '#8e8a9c' }}>{desc}</p>
              </div>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Erreur */}
      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {pending ? 'Envoi…' : 'Envoyer l\'invitation'}
        </button>
        <Link
          href="/dashboard/admin/invitations"
          className="px-5 py-2.5 text-sm font-medium rounded-lg"
          style={{ border: '1px solid #e4e0ec', color: '#353148' }}
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
