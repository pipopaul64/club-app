'use client'

import { useState } from 'react'

type Props = { url: string }

export function CopyLinkButton({ url }: Props) {
  const [copied, setCopied] = useState(false)

  async function onClick() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // fallback : ouvrir un prompt pour copier manuellement
      window.prompt('Copiez le lien :', url)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-medium hover:underline"
      style={{ color: '#8c60f3' }}
    >
      {copied ? '✓ Copié' : 'Copier le lien'}
    </button>
  )
}
