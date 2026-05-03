import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { checkRole } from '@/lib/check-role'
import {
  listConvocationsForEvent,
  listEligibleEvents,
} from '@/app/dashboard/convocations/actions'
import { generateWhatsAppText } from '@/lib/whatsapp'
import { CompositionForm } from './_components/CompositionForm'
import { RemovePlayerButton } from './_components/RemovePlayerButton'

type Props = {
  params: Promise<{ eventId: string }>
}

const TYPE_LABELS: Record<string, string> = {
  match:    'Match',
  training: 'Entraînement',
  other:    'Autre',
}

export default async function ConvocationDetailPage({ params }: Props) {
  // Gestion des compositions : managers/admin uniquement.
  // Les users voient les compteurs sur la liste /dashboard/team/convocations.
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')
  const ok = await checkRole(session.user.id, ['admin', 'manager'])
  if (!ok) redirect('/dashboard/team/convocations')

  const { eventId } = await params

  // Récupérer les convocations + l'événement via listEligibleEvents
  const [convocationList, allEvents] = await Promise.all([
    listConvocationsForEvent(eventId),
    listEligibleEvents(),
  ])

  const event = allEvents.find((e) => e.id === eventId)
  if (!event) notFound()

  const dateStr = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const timeStr = new Date(event.date).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  // Message WhatsApp
  const waText = generateWhatsAppText(event, convocationList)
  const waLink = `https://wa.me/?text=${encodeURIComponent(waText)}`

  // Statistiques de réponse
  const confirmed = convocationList.filter((c) => c.status === 'confirmed').length
  const declined  = convocationList.filter((c) => c.status === 'declined').length
  const pending   = convocationList.filter((c) => c.status === 'pending').length

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/team/convocations/new"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Nouvelle convocation
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Convocation
        </h1>
      </div>

      {/* Infos événement */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#f3f0ff', border: '1px solid #d4c8f8' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full mb-1 inline-block"
              style={{ color: '#8c60f3', backgroundColor: '#e9e2fd' }}
            >
              {TYPE_LABELS[event.type] ?? event.type}
            </span>
            <h2 className="text-lg font-bold" style={{ color: '#353148' }}>
              {event.title}
            </h2>
            <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
              📅 {dateStr} à {timeStr}
            </p>
            {event.location && (
              <p className="text-sm" style={{ color: '#8e8a9c' }}>
                📍 {event.location}
              </p>
            )}
            {event.team && (
              <p className="text-sm font-medium mt-1" style={{ color: '#8c60f3' }}>
                {event.team.name}
              </p>
            )}
          </div>

          {/* Ajouter d'autres joueurs */}
          <Link
            href={`/dashboard/team/convocations/new?eventId=${eventId}`}
            className="text-xs px-3 py-1.5 rounded-lg font-medium whitespace-nowrap"
            style={{ border: '1px solid #8c60f3', color: '#8c60f3' }}
          >
            + Ajouter des joueurs
          </Link>
        </div>

        {/* Stats réponses */}
        {convocationList.length > 0 && (
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid #d4c8f8' }}>
            <span className="text-xs" style={{ color: '#166534' }}>
              ✓ {confirmed} confirmé{confirmed > 1 ? 's' : ''}
            </span>
            <span className="text-xs" style={{ color: '#92400e' }}>
              ⏳ {pending} en attente
            </span>
            {declined > 0 && (
              <span className="text-xs" style={{ color: '#991b1b' }}>
                ✗ {declined} décliné{declined > 1 ? 's' : ''}
              </span>
            )}
            <span className="text-xs ml-auto font-medium" style={{ color: '#353148' }}>
              {convocationList.length} convoqué{convocationList.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Composition */}
      {convocationList.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Aucun joueur convoqué pour l&apos;instant.
          </p>
          <Link
            href={`/dashboard/team/convocations/new?eventId=${eventId}`}
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Convoquer des joueurs →
          </Link>
        </div>
      ) : (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: '#353148' }}>
              Composition
            </h3>
            <span className="text-xs" style={{ color: '#8e8a9c' }}>
              Titulaire / Remplaçant / Non assigné
            </span>
          </div>

          {/* Boutons retirer — séparés du form composition pour éviter les conflits */}
          <div className="space-y-2 mb-4">
            {convocationList.map((conv) => (
              <div key={conv.id} className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium" style={{ color: '#353148' }}>
                  {conv.user.name}
                </span>
                <RemovePlayerButton convocationId={conv.id} />
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid #e4e0ec', paddingTop: '1rem' }}>
            <CompositionForm eventId={eventId} convocations={convocationList} />
          </div>
        </div>
      )}

      {/* WhatsApp */}
      {convocationList.length > 0 && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <h3 className="text-base font-semibold mb-3" style={{ color: '#353148' }}>
            Partager sur WhatsApp
          </h3>

          {/* Aperçu du message */}
          <pre
            className="text-xs rounded-lg p-3 mb-4 whitespace-pre-wrap font-mono overflow-auto max-h-56"
            style={{ backgroundColor: '#f8f6fc', color: '#353148', border: '1px solid #e4e0ec' }}
          >
            {waText}
          </pre>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#25D366' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.119.553 4.107 1.523 5.832L0 24l6.327-1.497A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.8 9.8 0 01-4.964-1.346l-.356-.211-3.753.887.938-3.65-.231-.374A9.789 9.789 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/>
            </svg>
            Partager sur WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
