import { db } from '@/db'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { eq, isNull, and, ne } from 'drizzle-orm'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CotisationForm } from './_components/CotisationForm'

export default async function NewCotisationPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const clubId = (session.user as { clubId?: string }).clubId
  if (!clubId) redirect('/login')

  // Tous les licenciés actifs du club
  const clubUsers = await db.query.users.findMany({
    where: and(eq(users.clubId, clubId), isNull(users.deletedAt)),
    columns: { id: true, name: true, email: true },
    orderBy: (u, { asc }) => [asc(u.name)],
  })

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Nouvelle cotisation
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Associer une cotisation à un licencié du club
        </p>
      </div>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
      >
        <CotisationForm users={clubUsers} />
      </div>
    </div>
  )
}
