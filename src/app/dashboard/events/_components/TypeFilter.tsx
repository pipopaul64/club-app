'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const TYPE_OPTIONS = [
  { value: 'match', label: 'Match' },
  { value: 'training', label: 'Entraînement' },
  { value: 'other', label: 'Autre' },
]

type Props = {
  currentType?: string
}

export function TypeFilter({ currentType }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('type', e.target.value)
    } else {
      params.delete('type')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      defaultValue={currentType ?? ''}
      onChange={handleChange}
      className="px-3 py-1.5 rounded-lg text-sm outline-none transition-all"
      style={{
        border: '1px solid #e4e0ec',
        color: '#353148',
        backgroundColor: '#ffffff',
      }}
    >
      <option value="">Tous les types</option>
      {TYPE_OPTIONS.map(({ value, label }) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  )
}
