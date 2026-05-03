import { db } from '@/db'
import { teamManagers } from '@/db/schema'
import { and, eq } from 'drizzle-orm'

/**
 * Helpers de lecture pour la relation many-to-many `team_managers`.
 *
 * Remplace l'ancien lookup `teams.managerId === userId` qui n'existe plus
 * (cf. DECISIONS.md — Sprint multi-manager).
 */

/**
 * Liste des teamId que `userId` gère dans le club courant.
 * (Le clubId est exigé pour la sécurité multi-tenant.)
 */
export async function listManagedTeamIds(userId: string, clubId: string): Promise<string[]> {
  const rows = await db.query.teamManagers.findMany({
    where:   and(eq(teamManagers.userId, userId), eq(teamManagers.clubId, clubId)),
    columns: { teamId: true },
  })
  return rows.map((r) => r.teamId)
}

/**
 * Vrai si `userId` gère `teamId`. Pas besoin du clubId : la jointure
 * fait foi (un team_manager.teamId est unique au sein du club via la FK).
 */
export async function isManagerOfTeam(userId: string, teamId: string): Promise<boolean> {
  const row = await db.query.teamManagers.findFirst({
    where:   and(eq(teamManagers.userId, userId), eq(teamManagers.teamId, teamId)),
    columns: { id: true },
  })
  return row !== undefined
}
