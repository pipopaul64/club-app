import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'

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

  if (!session) {
    redirect('/login')
  }

  return <>{children}</>
}
