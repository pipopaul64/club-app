import Link from 'next/link'
import { createUser } from '@/app/dashboard/admin/actions'
import { UserForm } from '../_components/UserForm'

export default function NewUserPage() {
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
          Ajouter un licencié
        </h1>
        <p className="text-sm mt-1" style={{ color: '#8e8a9c' }}>
          Le licencié pourra se connecter via magic link avec son email.
        </p>
      </div>

      <div className="rounded-xl p-6" style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}>
        <UserForm
          action={createUser}
          submitLabel="Ajouter le licencié"
          cancelHref="/dashboard/admin/users"
        />
      </div>
    </div>
  )
}
