import Link from 'next/link'
import { listUsers } from '@/app/dashboard/admin/actions'
import { DeactivateButton } from './_components/DeactivateButton'
import type { UserRole } from '@/db/schema'

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Licencié',
  manager_sportif: 'Manager Sportif',
  manager_associatif: 'Manager Associatif',
  admin: 'Administrateur',
}

const ROLE_COLORS: Record<UserRole, string> = {
  user: '#353148',
  manager_sportif: '#1a7a4a',
  manager_associatif: '#2563eb',
  admin: '#8c60f3',
}

export default async function UsersPage() {
  const users = await listUsers()

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Licenciés</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
            {users.length} licencié{users.length > 1 ? 's' : ''} actif{users.length > 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/admin/users/new"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Ajouter un licencié
        </Link>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: '#f8f6fc', border: '1px solid #e4e0ec' }}
        >
          <p className="text-sm" style={{ color: '#8e8a9c' }}>Aucun licencié pour le moment.</p>
          <Link
            href="/dashboard/admin/users/new"
            className="inline-block mt-3 text-sm font-medium hover:underline"
            style={{ color: '#8c60f3' }}
          >
            Ajouter le premier licencié →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e0ec' }}>
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#f8f6fc' }}>
              <tr>
                {['Nom', 'Email', 'Téléphone', 'Rôle', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 font-medium"
                    style={{ color: '#8e8a9c', borderBottom: '1px solid #e4e0ec' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  style={{
                    backgroundColor: i % 2 === 0 ? '#ffffff' : '#fdfcff',
                    borderBottom: i < users.length - 1 ? '1px solid #f0eef8' : 'none',
                  }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: '#353148' }}>
                    {user.name}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#353148' }}>
                    {user.email}
                  </td>
                  <td className="px-4 py-3" style={{ color: '#8e8a9c' }}>
                    {user.phone ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{
                        color: ROLE_COLORS[user.role as UserRole],
                        backgroundColor: `${ROLE_COLORS[user.role as UserRole]}18`,
                      }}
                    >
                      {ROLE_LABELS[user.role as UserRole]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/dashboard/admin/users/${user.id}/edit`}
                        className="text-sm font-medium hover:underline"
                        style={{ color: '#8c60f3' }}
                      >
                        Modifier
                      </Link>
                      <DeactivateButton userId={user.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
