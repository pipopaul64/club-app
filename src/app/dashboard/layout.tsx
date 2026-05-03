import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import type { SessionUser } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let session = null
  try {
    session = await auth.api.getSession({ headers: await headers() })
  } catch {
    redirect('/login')
  }

  if (!session) redirect('/login')

  const user = session.user as unknown as SessionUser

  // Onboarding gate : tant que `users.onboardingCompletedAt` est null,
  // l'utilisateur est renvoyé vers /onboarding pour choisir ses équipes.
  // Lecture DB (pas dans la session pour éviter d'exposer le champ au client).
  const dbUser = await db.query.users.findFirst({
    where: eq(users.id, user.id),
    columns: { onboardingCompletedAt: true, clubId: true },
  })
  if (!dbUser?.onboardingCompletedAt) {
    redirect('/onboarding')
  }

  return (
    <DashboardShell roles={user.roles} userName={user.name ?? user.email}>
      {children}
    </DashboardShell>
  )
}
