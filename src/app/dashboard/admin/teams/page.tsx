import Link from 'next/link'
import { listTeams } from '@/app/dashboard/admin/actions'
import { DeleteTeamButton } from './_components/DeleteTeamButton'

export default async function TeamsPage() {
  const teams = await listTeams()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
            Équipes
          </h1>
          <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
            {teams.length} équipe{teams.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/admin/teams/new"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Créer une équipe
        </Link>
      </div>

      {/* Contenu */}
      {teams.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: '#f8f6fc', border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Aucune équipe pour le moment.
          </p>
          <Link
            href="/dashboard/admin/teams/new"
            className="inline-block mt-3 text-sm font-medium hover:underline"
            style={{ color: '#8c60f3' }}
          >
            Créer la première équipe →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {teams.map((team) => (
            <div
              key={team.id}
              className="rounded-xl p-5 flex items-center justify-between"
              style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
            >
              {/* Infos équipe */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-base font-semibold" style={{ color: '#353148' }}>
                    {team.name}
                  </h2>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: '#8c60f3', backgroundColor: '#8c60f318' }}
                  >
                    {team.category}
                  </span>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{ color: '#353148', backgroundColor: '#f8f6fc' }}
                  >
                    {team.season}
                  </span>
                </div>
                <p className="text-sm" style={{ color: '#8e8a9c' }}>
                  {team.members.length} joueur{team.members.length > 1 ? 's' : ''} ·{' '}
                  Manager : {team.manager?.name ?? '—'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 ml-4 shrink-0">
                <Link
                  href={`/dashboard/admin/teams/${team.id}`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#8c60f3' }}
                >
                  Voir
                </Link>
                <Link
                  href={`/dashboard/admin/teams/${team.id}/edit`}
                  className="text-sm font-medium hover:underline"
                  style={{ color: '#353148' }}
                >
                  Modifier
                </Link>
                <DeleteTeamButton teamId={team.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
