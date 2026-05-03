'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

type Team = { id: string; name: string; category?: string; season?: string }

type Props = {
  teams:     Team[]
  activeId:  string
  /** Affiche label avant le select (par défaut « Équipe ») */
  label?:    string
}

/**
 * Sélecteur d'équipe pour les pages /dashboard/team/*. Persiste via le
 * query param `?teamId=X` — le Server Component lit le param et re-render.
 * Préserve les autres search params en place.
 */
export function TeamPicker({ teams, activeId, label = 'Équipe' }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  if (teams.length === 0) return null
  // Pas de picker si une seule équipe — affichage purement lecture
  if (teams.length === 1) {
    return (
      <div className="text-sm" style={{ color: '#8e8a9c' }}>
        {label} : <span style={{ color: '#353148', fontWeight: 500 }}>{teams[0].name}</span>
      </div>
    )
  }

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newId = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    params.set('teamId', newId)
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <label className="flex items-center gap-2 text-sm" style={{ color: '#353148' }}>
      <span style={{ color: '#8e8a9c' }}>{label} :</span>
      <select
        value={activeId}
        onChange={onChange}
        disabled={pending}
        className="px-3 py-1.5 rounded-lg text-sm outline-none"
        style={{ border: '1px solid #e4e0ec', backgroundColor: '#ffffff' }}
      >
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </label>
  )
}
