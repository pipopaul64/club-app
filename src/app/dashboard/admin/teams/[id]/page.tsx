import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getTeam,
  listAvailablePlayers,
  listManagers,
  addManagerToTeam,
  assignPlayerToTeam,
} from '@/app/dashboard/admin/actions'
import { AssignManagerForm } from '../_components/AssignManagerForm'
import { AssignPlayerForm } from '../_components/AssignPlayerForm'
import { RemovePlayerButton } from '../_components/RemovePlayerButton'
import { RemoveManagerButton } from '../_components/RemoveManagerButton'

type Props = {
  params: Promise<{ id: string }>
}

export default async function TeamDetailPage({ params }: Props) {
  const { id } = await params

  const [team, availablePlayers, allManagers] = await Promise.all([
    getTeam(id),
    listAvailablePlayers(id),
    listManagers(),
  ])

  if (!team) notFound()

  // Liste des managers déjà assignés (pour les exclure du sélecteur)
  const assignedManagerIds = new Set(team.managers.map((m) => m.user.id))
  const assignableManagers = allManagers.filter((m) => !assignedManagerIds.has(m.id))

  // Lier l'id via bind — ne transite jamais par le client
  const addManagerAction  = addManagerToTeam.bind(null, id)
  const assignPlayerAction = assignPlayerToTeam.bind(null, id)

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/teams"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux équipes
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
              {team.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ color: '#8c60f3', backgroundColor: '#8c60f318' }}
              >
                {team.category}
              </span>
              <span className="text-xs" style={{ color: '#8e8a9c' }}>
                Saison {team.season}
              </span>
            </div>
          </div>
          <Link
            href={`/dashboard/admin/teams/${id}/edit`}
            className="px-4 py-2 text-sm font-medium rounded-lg"
            style={{ border: '1px solid #e4e0ec', color: '#353148' }}
          >
            Modifier
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section Managers (m:n) */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#353148' }}>
            Managers{' '}
            <span
              className="text-xs font-normal ml-1 px-1.5 py-0.5 rounded-full"
              style={{ color: '#8e8a9c', backgroundColor: '#f8f6fc' }}
            >
              {team.managers.length}
            </span>
          </h2>

          {/* Liste des managers actuels */}
          {team.managers.length > 0 && (
            <div className="mb-5 divide-y" style={{ borderColor: '#f0eef8' }}>
              {team.managers.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2.5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: '#8c60f3' }}
                    >
                      {(m.user.name ?? m.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#353148' }}>
                        {m.user.name ?? m.user.email}
                      </p>
                      <p className="text-xs" style={{ color: '#8e8a9c' }}>{m.user.email}</p>
                    </div>
                  </div>
                  <RemoveManagerButton
                    teamId={id}
                    managerId={m.user.id}
                    managerName={m.user.name ?? m.user.email}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Ajouter un manager */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#8e8a9c' }}>
              Ajouter un manager
            </p>
            {assignableManagers.length === 0 ? (
              <p className="text-sm" style={{ color: '#8e8a9c' }}>
                {allManagers.length === 0 ? (
                  <>
                    Aucun licencié n&apos;a le rôle Manager dans ce club.{' '}
                    <Link
                      href="/dashboard/admin/users"
                      className="underline"
                      style={{ color: '#8c60f3' }}
                    >
                      Gérer les rôles
                    </Link>
                  </>
                ) : (
                  'Tous les managers du club sont déjà assignés à cette équipe.'
                )}
              </p>
            ) : (
              <AssignManagerForm action={addManagerAction} managers={assignableManagers} />
            )}
          </div>
        </div>

        {/* Section Joueurs */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
        >
          <h2 className="text-sm font-semibold mb-3" style={{ color: '#353148' }}>
            Joueurs{' '}
            <span
              className="text-xs font-normal ml-1 px-1.5 py-0.5 rounded-full"
              style={{ color: '#8e8a9c', backgroundColor: '#f8f6fc' }}
            >
              {team.members.length}
            </span>
          </h2>

          {/* Liste des joueurs */}
          {team.members.length > 0 && (
            <div className="mb-5 divide-y" style={{ borderColor: '#f0eef8' }}>
              {team.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                      style={{ backgroundColor: '#cccad2' }}
                    >
                      {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: '#353148' }}>
                        {member.user.name ?? member.user.email}
                      </p>
                      <p className="text-xs" style={{ color: '#8e8a9c' }}>
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <RemovePlayerButton
                    teamId={id}
                    userId={member.user.id}
                    playerName={member.user.name ?? member.user.email}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Formulaire ajout joueur */}
          <div>
            <p className="text-xs font-medium mb-2" style={{ color: '#8e8a9c' }}>
              Ajouter un joueur
            </p>
            <AssignPlayerForm action={assignPlayerAction} players={availablePlayers} />
          </div>
        </div>
      </div>
    </div>
  )
}
