import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getUser, updateUser } from '@/app/dashboard/admin/actions'
import { UserForm } from '../../_components/UserForm'
import type { UserRole } from '@/db/schema'

type Props = {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: Props) {
  const { id } = await params
  const user = await getUser(id)

  if (!user) notFound()

  // Lie l'id au Server Action via bind — l'id ne transite pas par le client
  const updateUserWithId = updateUser.bind(null, id)

  return (
    <div className="p-6 max-w-xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/admin/users"
          className="text-sm hover:underline mb-2 inline-block"
          style={{ color: '#8e8a9c' }}
        >
          ← Retour aux licenciés
        </Link>
        <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>
          Modifier le licencié
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>{user.email}</p>
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}>
        <UserForm
          action={updateUserWithId}
          defaultValues={{
            name: user.name,
            email: user.email,
            phone: user.phone ?? undefined,
            role: user.role as UserRole,
            birthDate: user.birthDate ? user.birthDate.toISOString() : null,
          }}
          submitLabel="Enregistrer les modifications"
          cancelHref="/dashboard/admin/users"
        />
      </div>
    </div>
  )
}
