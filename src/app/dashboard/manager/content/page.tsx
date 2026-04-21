import Link from 'next/link'
import { listManagerMessages } from '@/app/dashboard/content/actions'
import { DeleteMessageButton } from './_components/DeleteMessageButton'

export default async function ManagerContentPage() {
  const messageList = await listManagerMessages()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
            Messages
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            Messages publiés vers vos équipes
          </p>
        </div>
        <Link
          href="/dashboard/manager/content/new"
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouveau
        </Link>
      </div>

      {/* Liste vide */}
      {messageList.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Aucun message publié pour le moment.
          </p>
          <Link
            href="/dashboard/manager/content/new"
            className="mt-3 inline-block text-sm font-medium"
            style={{ color: '#8c60f3' }}
          >
            Publier un message →
          </Link>
        </div>
      )}

      {/* Messages */}
      {messageList.length > 0 && (
        <div className="space-y-3">
          {messageList.map((msg) => {
            const dateStr = new Date(msg.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })
            const timeStr = new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={msg.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Destinataire */}
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
                      >
                        {msg.team ? `📋 ${msg.team.name}` : '🌐 Tout le club'}
                      </span>
                      <span className="text-xs" style={{ color: '#8e8a9c' }}>
                        {dateStr} à {timeStr}
                      </span>
                    </div>

                    {/* Contenu */}
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: '#353148' }}
                    >
                      {msg.content}
                    </p>
                  </div>

                  {/* Supprimer */}
                  <DeleteMessageButton messageId={msg.id} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
