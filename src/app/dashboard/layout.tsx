import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
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

  return (
    <DashboardShell roles={user.roles} userName={user.name}>
      {children}
    </DashboardShell>
  )
}
