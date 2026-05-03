import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { DashboardNav } from '@/components/dashboard/DashboardNav'
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
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f6fc' }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 h-full overflow-hidden">
        <DashboardNav role={user.role} userName={user.name} />
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
