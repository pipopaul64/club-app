import Link from 'next/link'
import { listMyConvocations } from '@/app/dashboard/convocations/actions'
import { StatusButtons } from './_components/StatusButtons'


const TYPE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  match:    { label: 'Match',         color: '#c0392b', bg: '#fdf0f0' },
  training: { label: 'Entraînement',  color: '#2563eb', bg: '#eff6ff' },
  other:    { label: 'Autre',          color: '#8c60f3', bg: '#f3f0ff' },
}

const POSITION_LABELS: Record<string, string> = {
  starter:   '👕 Titulaire',
  substitute: '🔄 Remplaçant',
}

export default async function ConvocationsPage() {
  const myConvocations = await listMyConvocations()

  const upcoming = myConvocations.filter(
    (c) => new Date(c.event.date) >= new Date(),
  )
  const past = myConvocations.filter(
    (c) => new Date(c.event.date) < new Date(),
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/dashboard/calendar"
            className="text-sm hover:underline mb-2 inline-block"
            style={{ color: '#8e8a9c' }}
          >
            ← Calendrier
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
            Mes convocations
          </h1>
        </div>
      </div>

      {myConvocations.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Vous n&apos;avez aucune convocation pour le moment.
          </p>
        </div>
      )}

      {/* Convocations à venir */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: '#8e8a9c' }}>
            À venir
          </h2>
          <div className="space-y-3">
            {upcoming.map((conv) => {
              const typeCfg = TYPE_LABELS[conv.event.type] ?? TYPE_LABELS.other
              const positionKey =
                conv.isStarter === true ? 'starter' :
                conv.isStarter === false ? 'substitute' : null

              return (
                <div
                  key={conv.id}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    {/* Infos événement */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}
                        >
                          {typeCfg.label}
                        </span>
                        {positionKey && (
                          <span className="text-xs" style={{ color: '#8c60f3' }}>
                            {POSITION_LABELS[positionKey]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold truncate" style={{ color: '#353148' }}>
                        {conv.event.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#8e8a9c' }}>
                        📅{' '}
                        {new Date(conv.event.date).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'long',
                        })}{' '}
                        à{' '}
                        {new Date(conv.event.date).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {conv.event.location && ` · 📍 ${conv.event.location}`}
                      </p>
                      {conv.teamName && (
                        <p className="text-xs mt-0.5" style={{ color: '#8c60f3' }}>
                          {conv.teamName}
                        </p>
                      )}
                    </div>

                    {/* Boutons statut */}
                    <StatusButtons
                      convocationId={conv.id}
                      currentStatus={conv.status}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Convocations passées */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide" style={{ color: '#8e8a9c' }}>
            Passées
          </h2>
          <div className="space-y-2">
            {past.map((conv) => {
              const typeCfg = TYPE_LABELS[conv.event.type] ?? TYPE_LABELS.other
              const positionKey =
                conv.isStarter === true ? 'starter' :
                conv.isStarter === false ? 'substitute' : null

              return (
                <div
                  key={conv.id}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ backgroundColor: '#fafafa', border: '1px solid #f0eef8' }}
                >
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: typeCfg.color, backgroundColor: typeCfg.bg }}
                  >
                    {typeCfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: '#8e8a9c' }}>
                      {conv.event.title}
                    </p>
                    <p className="text-xs" style={{ color: '#b0acbc' }}>
                      {new Date(conv.event.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                      {positionKey && ` · ${POSITION_LABELS[positionKey]}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Lien feuille de match/présence */}
                    {conv.status === 'confirmed' && (
                      <Link
                        href={`/dashboard/match-sheet/${conv.event.id}`}
                        className="text-xs px-2 py-0.5 rounded-full hover:opacity-80 transition-opacity"
                        style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
                      >
                        {conv.event.type === 'match' ? '📋 Feuille' : '✓ Présences'}
                      </Link>
                    )}
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={
                        conv.status === 'confirmed'
                          ? { color: '#166534', backgroundColor: '#dcfce7' }
                          : conv.status === 'declined'
                          ? { color: '#991b1b', backgroundColor: '#fee2e2' }
                          : { color: '#92400e', backgroundColor: '#fef3c7' }
                      }
                    >
                      {conv.status === 'confirmed' ? 'Confirmé'
                       : conv.status === 'declined' ? 'Décliné'
                       : 'En attente'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
