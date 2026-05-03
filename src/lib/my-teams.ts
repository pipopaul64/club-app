import { db } from '@/db'
import { teamManagers, teamMembers, teams } from '@/db/schema'
import { and, eq, inArray } from 'drizzle-orm'
import type { UserRole } from '@/db/schema'

/**
 * Équipes "à moi" pour la section /dashboard/team — union de :
 *  - admin : toutes les équipes du club
 *  - manager : équipes que je gère ∪ équipes où je joue
 *  - user (pur) : équipes où je joue (team_members)
 *
 * Trié par nom. Renvoie la forme attendue par le picker.
 */
export type MyTeam = {
  id:       string
  name:     string
  category: string
  season:   string
}

export async function listMyTeams(
  userId: string,
  clubId: string,
  roles: UserRole[],
): Promise<MyTeam[]> {
  if (roles.includes('admin')) {
    return db.query.teams.findMany({
      where:   eq(teams.clubId, clubId),
      columns: { id: true, name: true, category: true, season: true },
      orderBy: (t, { asc }) => [asc(t.name)],
    })
  }

  // Union : équipes où je joue + équipes que je gère
  const [memberRows, managerRows] = await Promise.all([
    db.query.teamMembers.findMany({
      where:   and(eq(teamMembers.userId, userId), eq(teamMembers.clubId, clubId)),
      columns: { teamId: true },
    }),
    db.query.teamManagers.findMany({
      where:   and(eq(teamManagers.userId, userId), eq(teamManagers.clubId, clubId)),
      columns: { teamId: true },
    }),
  ])
  const teamIds = Array.from(
    new Set([...memberRows.map((r) => r.teamId), ...managerRows.map((r) => r.teamId)]),
  )
  if (teamIds.length === 0) return []

  return db.query.teams.findMany({
    where:   and(eq(teams.clubId, clubId), inArray(teams.id, teamIds)),
    columns: { id: true, name: true, category: true, season: true },
    orderBy: (t, { asc }) => [asc(t.name)],
  })
}

/**
 * Choisit l'équipe à afficher : l'ID demandé via ?teamId=X si valide,
 * sinon la première dispo, sinon null. Le caller redirige ou affiche
 * un état vide selon le cas.
 */
export function pickActiveTeam<T extends { id: string }>(
  teams: T[],
  requestedId: string | undefined,
): T | null {
  if (teams.length === 0) return null
  if (requestedId) {
    const found = teams.find((t) => t.id === requestedId)
    if (found) return found
  }
  return teams[0]
}
