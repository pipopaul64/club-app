import Link from 'next/link'
import { auth } from '@/lib/auth'
import { checkRole } from '@/lib/check-role'
import { listManagedTeamIds } from '@/lib/team-managers'
import { db } from '@/db'
import { teams } from '@/db/schema'
import { eq, and, inArray } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { ContentForm } from './_components/ContentForm'
import type { UserRole } from '@/db/schema'

type Props = { searchParams: Promise<{ teamId?: string }> }

export default async function NewContentPage({ searchParams }: Props) {
  const { teamId: requestedTeamId } = await searchParams
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const ok = await checkRole(session.user.id, ['admin', 'manager'])
  if (!ok) redirect('/dashboard')

  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) redirect('/dashboard')

  const roles = ((session.user as { roles?: UserRole[] }).roles ?? ['user']) as UserRole[]
  const userId = session.user.id

  const isAdmin = roles.includes('admin')

  // Récupérer les équipes disponibles
  let availableTeams: { id: string; name: string }[] = []

  if (isAdmin) {
    availableTeams = await db.query.teams.findMany({
      where: eq(teams.clubId, clubId),
      columns: { id: true, name: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  } else {
    // Manager : uniquement ses équipes (via team_managers)
    const managedIds = await listManagedTeamIds(userId, clubId)
    availableTeams = managedIds.length === 0
      ? []
      : await db.query.teams.findMany({
          where: and(eq(teams.clubId, clubId), inArray(teams.id, managedIds)),
          columns: { id: true, name: true },
          orderBy: (t, { asc }) => [asc(t.name)],
        })
  }

  // Manager sportif sans équipe → pas de formulaire
  if (!isAdmin && availableTeams.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <Link
            href="/dashboard/team/content"
            className="text-sm hover:underline mb-2 inline-block"
            style={{ color: '#8e8a9c' }}
          >
            ← Mes messages
          </Link>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
            Nouveau message
          </h1>
        </div>
        <div
          className="rounded-xl p-8 text-center"
          style={{ border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>
            Vous n&apos;avez aucune équipe assignée. Contactez un administrateur.
          </p>
        </div>
      </div>
    )
  }

  // Pré-sélection : ?teamId=X si valide, sinon une seule équipe → cette équipe
  const defaultTeamId =
    (requestedTeamId && availableTeams.some((t) => t.id === requestedTeamId)
      ? requestedTeamId
      : undefined)
    ?? (!isAdmin && availableTeams.length === 1 ? availableTeams[0].id : undefined)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/team/content"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Mes messages
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouveau message
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Publiez un message visible par les membres de l&apos;équipe.
        </p>
      </div>

      {/* Formulaire */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <ContentForm
          teams={availableTeams}
          isAdmin={isAdmin}
          defaultTeamId={defaultTeamId}
        />
      </div>
    </div>
  )
}
