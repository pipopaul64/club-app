import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTeam, updateTeam, listTeamCategories } from '@/app/dashboard/admin/actions'
import { TeamForm } from '../../_components/TeamForm'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditTeamPage({ params }: Props) {
  const { id } = await params

  const [team, existingCategories] = await Promise.all([
    getTeam(id),
    listTeamCategories(),
  ])

  if (!team) notFound()

  const updateTeamWithId = updateTeam.bind(null, id)

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href={`/dashboard/admin/teams/${id}`}
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour à l&apos;équipe
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Modifier l&apos;équipe
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          {team.name} · {team.category} · {team.season}
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <TeamForm
          action={updateTeamWithId}
          defaultValues={{
            name: team.name,
            category: team.category,
            season: team.season,
          }}
          existingCategories={existingCategories}
          submitLabel="Enregistrer les modifications"
          cancelHref={`/dashboard/admin/teams/${id}`}
        />
      </div>
    </div>
  )
}
