/**
 * Génération du message WhatsApp pour les convocations.
 * Fichier utilitaire pur (pas de Server Action).
 */

export function generateWhatsAppText(
  event: { title: string; type: string; date: Date; location?: string | null },
  convocationList: Array<{
    user: { name: string }
    isStarter: boolean | null
  }>,
): string {
  const typeEmoji: Record<string, string> = {
    match:    '🏆 MATCH',
    training: '🏃 ENTRAÎNEMENT',
    other:    '📅 ÉVÉNEMENT',
  }

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const starters    = convocationList.filter((c) => c.isStarter === true)
  const substitutes = convocationList.filter((c) => c.isStarter === false)
  const unassigned  = convocationList.filter((c) => c.isStarter === null)
  const hasComposition = starters.length > 0 || substitutes.length > 0

  let msg = `📋 *CONVOCATION*\n\n`
  msg += `${typeEmoji[event.type] ?? '📅 ÉVÉNEMENT'}\n`
  msg += `*${event.title}*\n\n`
  msg += `📅 ${dateStr} à ${timeStr}\n`
  if (event.location) msg += `📍 ${event.location}\n`

  if (hasComposition) {
    if (starters.length > 0) {
      msg += `\n👕 *Titulaires :*\n`
      starters.forEach((c) => { msg += `• ${c.user.name}\n` })
    }
    if (substitutes.length > 0) {
      msg += `\n🔄 *Remplaçants :*\n`
      substitutes.forEach((c) => { msg += `• ${c.user.name}\n` })
    }
    if (unassigned.length > 0) {
      msg += `\n👥 *Autres convoqués :*\n`
      unassigned.forEach((c) => { msg += `• ${c.user.name}\n` })
    }
  } else {
    msg += `\n👥 *Joueurs convoqués :*\n`
    convocationList.forEach((c) => { msg += `• ${c.user.name}\n` })
  }

  msg += `\nBonne chance ! 💪`
  return msg
}
