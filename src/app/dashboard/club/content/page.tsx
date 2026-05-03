import Link from 'next/link'
import { listMyTeamMessages } from '@/app/dashboard/content/actions'

export default async function ContentPage() {
  const messageList = await listMyTeamMessages()

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
            Messages
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            Messages de votre équipe et du club
          </p>
        </div>
      </div>

      {/* Aucun message */}
      {messageList.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Aucun message pour le moment.
          </p>
        </div>
      )}

      {/* Liste des messages */}
      {messageList.length > 0 && (
        <div className="space-y-4">
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
                {/* En-tête du message */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
                  >
                    {msg.team ? `📋 ${msg.team.name}` : '🌐 Club'}
                  </span>
                  <span className="text-xs" style={{ color: '#8e8a9c' }}>
                    De {msg.author.name} · {dateStr} à {timeStr}
                  </span>
                </div>

                {/* Contenu */}
                <p
                  className="text-sm whitespace-pre-wrap"
                  style={{ color: '#353148', lineHeight: '1.6' }}
                >
                  {msg.content}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
