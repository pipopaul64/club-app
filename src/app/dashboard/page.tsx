import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import type { SessionUser } from '@/types'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user as unknown as SessionUser

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Bienvenue, {user.name}</h1>
      <p className="text-gray-600 mt-2">Rôle : {user.role}</p>
    </main>
  )
}
