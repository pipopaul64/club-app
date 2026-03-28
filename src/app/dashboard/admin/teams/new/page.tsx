import Link from 'next/link'
import { createTeam } from '@/app/dashboard/admin/actions'
import { TeamForm } from '../_components/TeamForm'

export default function NewTeamPage() {
  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/teams"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux équipes
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Créer une équipe
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Vous pourrez ensuite assigner un manager et des joueurs.
        </p>
      </div>

      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <TeamForm
          action={createTeam}
          submitLabel="Créer l'équipe"
          cancelHref="/dashboard/admin/teams"
        />
      </div>
    </div>
  )
}
