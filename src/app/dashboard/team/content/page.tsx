import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { listTeamMessages } from '@/app/dashboard/content/actions'
import { listMyTeams, pickActiveTeam } from '@/lib/my-teams'
import { TeamPicker } from '@/components/dashboard/TeamPicker'
import { DeleteMessageButton } from './_components/DeleteMessageButton'
import type { UserRole } from '@/db/schema'

type Props = { searchParams: Promise<{ teamId?: string }> }

export default async function TeamContentPage({ searchParams }: Props) {
  const { teamId: requestedTeamId } = await searchParams

  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const userId = session.user.id
  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) redirect('/dashboard')
  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]

  const myTeams    = await listMyTeams(userId, clubId, roles)
  const activeTeam = pickActiveTeam(myTeams, requestedTeamId)
  const isManager  = roles.includes('manager') || roles.includes('admin')

  const messageList = activeTeam ? await listTeamMessages(activeTeam.id) : []

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Messages</h1>
          <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
            {isManager ? 'Messages publiés vers votre équipe' : 'Messages reçus de votre équipe'}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {activeTeam && (
            <TeamPicker teams={myTeams} activeId={activeTeam.id} />
          )}
          {isManager && activeTeam && (
            <Link
              href={`/dashboard/team/content/new?teamId=${activeTeam.id}`}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ backgroundColor: '#8c60f3' }}
            >
              + Nouveau
            </Link>
          )}
        </div>
      </div>

      {myTeams.length === 0 ? (
        <EmptyState
          title="Aucune équipe pour le moment"
          description="Vous n'êtes membre ou manager d'aucune équipe. Contactez un administrateur du club."
        />
      ) : !activeTeam ? null : messageList.length === 0 ? (
        <EmptyState
          title="Aucun message pour le moment"
          description={isManager ? 'Soyez le premier à publier !' : "Pas encore de message pour cette équipe."}
          cta={isManager ? { href: `/dashboard/team/content/new?teamId=${activeTeam.id}`, label: 'Publier un message →' } : undefined}
        />
      ) : (
        <div className="space-y-3">
          {messageList.map((msg) => {
            const dateStr = new Date(msg.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric', month: 'long', year: 'numeric',
            })
            const timeStr = new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
              hour: '2-digit', minute: '2-digit',
            })
            const canDelete = isManager && (roles.includes('admin') || msg.author?.id === userId)

            return (
              <div
                key={msg.id}
                className="rounded-xl p-5"
                style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
                      >
                        {msg.author?.name ?? 'Auteur inconnu'}
                      </span>
                      <span className="text-xs" style={{ color: '#8e8a9c' }}>
                        {dateStr} à {timeStr}
                      </span>
                    </div>
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: '#353148' }}
                    >
                      {msg.content}
                    </p>
                  </div>

                  {canDelete && <DeleteMessageButton messageId={msg.id} />}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  title, description, cta,
}: {
  title:       string
  description: string
  cta?:        { href: string; label: string }
}) {
  return (
    <div
      className="rounded-xl p-10 text-center"
      style={{ border: '1px solid #e4e0ec' }}
    >
      <p className="text-sm font-medium" style={{ color: '#353148' }}>{title}</p>
      <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>{description}</p>
      {cta && (
        <Link
          href={cta.href}
          className="mt-3 inline-block text-sm font-medium"
          style={{ color: '#8c60f3' }}
        >
          {cta.label}
        </Link>
      )}
    </div>
  )
}
