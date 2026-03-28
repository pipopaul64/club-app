'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

type Team = { id: string; name: string }

type Props = {
  teams: Team[]
  currentTeamId?: string
}

export function TeamFilter({ teams, currentTeamId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('teamId', e.target.value)
    } else {
      params.delete('teamId')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (teams.length === 0) return null

  return (
    <select
      defaultValue={currentTeamId ?? ''}
      onChange={handleChange}
      className="px-3 py-1.5 rounded-lg text-sm outline-none transition-all"
      style={{
        border: '1px solid #e4e0ec',
        color: '#353148',
        backgroundColor: '#ffffff',
      }}
    >
      <option value="">Toutes les équipes</option>
      {teams.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  )
}
