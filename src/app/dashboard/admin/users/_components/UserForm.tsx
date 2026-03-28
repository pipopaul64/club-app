'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import type { ActionResult } from '@/types'
import type { UserRole } from '@/db/schema'

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Licencié',
  manager_sportif: 'Manager Sportif',
  manager_associatif: 'Manager Associatif',
  admin: 'Administrateur',
}

type UserFormValues = {
  name?: string
  email?: string
  phone?: string
  role?: UserRole
  birthDate?: string | null
}

type UserFormProps = {
  action: (prev: ActionResult, formData: FormData) => Promise<ActionResult>
  defaultValues?: UserFormValues
  submitLabel: string
  cancelHref: string
}

const initialState: ActionResult = { success: false, error: '' }

export function UserForm({ action, defaultValues, submitLabel, cancelHref }: UserFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(action, initialState)

  useEffect(() => {
    if (state.success) {
      router.push('/dashboard/admin/users')
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
      {/* Nom complet */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1" style={labelStyle}>
          Nom complet
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={defaultValues?.name ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#8c60f3')}
          onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="Jean Dupont"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1" style={labelStyle}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={defaultValues?.email ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#8c60f3')}
          onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="jean@exemple.com"
        />
      </div>

      {/* Téléphone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1" style={labelStyle}>
          Téléphone <span style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultValues?.phone ?? ''}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#8c60f3')}
          onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
          placeholder="+33 6 00 00 00 00"
        />
      </div>

      {/* Rôle */}
      <div>
        <label htmlFor="role" className="block text-sm font-medium mb-1" style={labelStyle}>
          Rôle
        </label>
        <select
          id="role"
          name="role"
          required
          defaultValue={defaultValues?.role ?? 'user'}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#8c60f3')}
          onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
        >
          {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Date de naissance */}
      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium mb-1" style={labelStyle}>
          Date de naissance <span style={{ color: '#8e8a9c' }}>(optionnel)</span>
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          defaultValue={
            defaultValues?.birthDate
              ? new Date(defaultValues.birthDate).toISOString().split('T')[0]
              : ''
          }
          className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
          style={inputStyle}
          onFocus={e => (e.target.style.borderColor = '#8c60f3')}
          onBlur={e => (e.target.style.borderColor = '#e4e0ec')}
        />
      </div>

      {/* Erreur */}
      {!state.success && state.error && (
        <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#c0392b', backgroundColor: '#fdf0f0' }}>
          {state.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2.5 text-sm font-medium rounded-lg text-white disabled:opacity-50 transition-opacity"
          style={{ backgroundColor: '#8c60f3' }}
        >
          {pending ? 'Enregistrement…' : submitLabel}
        </button>
        <Link
          href={cancelHref}
          className="px-5 py-2.5 text-sm font-medium rounded-lg transition-colors"
          style={{ border: '1px solid #e4e0ec', color: '#353148' }}
        >
          Annuler
        </Link>
      </div>
    </form>
  )
}
