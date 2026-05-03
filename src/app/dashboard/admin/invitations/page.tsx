import Link from 'next/link'
import { listInvitations } from './actions'
import { RevokeButton } from './_components/RevokeButton'
import { CopyLinkButton } from './_components/CopyLinkButton'

const ROLE_LABELS: Record<string, string> = {
  user:    'Licencié',
  manager: 'Manager',
}

export default async function InvitationsPage() {
  const invites = await listInvitations()

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  const pending = invites.filter((i) => !i.usedAt)
  const used    = invites.filter((i) =>  i.usedAt)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#353148' }}>Invitations</h1>
          <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
            Envoyez un lien pour qu&apos;un nouveau licencié rejoigne le club.
          </p>
        </div>
        <Link
          href="/dashboard/admin/invitations/new"
          className="px-4 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#8c60f3' }}
        >
          + Nouvelle invitation
        </Link>
      </div>

      {/* Pending */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
          En attente ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ backgroundColor: '#f8f6fc', border: '1px solid #e4e0ec', color: '#8e8a9c' }}
          >
            Aucune invitation en attente.
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e0ec' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#f8f6fc' }}>
                <tr>
                  {['Email', 'Rôle proposé', 'Envoyée le', 'Actions'].map((h) => (
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
                {pending.map((inv, i) => (
                  <tr
                    key={inv.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#ffffff' : '#fdfcff',
                      borderBottom: i < pending.length - 1 ? '1px solid #f0eef8' : 'none',
                    }}
                  >
                    <td className="px-4 py-3 font-medium" style={{ color: '#353148' }}>
                      {inv.email}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#353148' }}>
                      {ROLE_LABELS[inv.invitedRole] ?? inv.invitedRole}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8e8a9c' }}>
                      {new Date(inv.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <CopyLinkButton url={`${baseUrl}/invite/${inv.token}`} />
                        <RevokeButton invitationId={inv.id} email={inv.email} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Used */}
      {used.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: '#8e8a9c' }}>
            Acceptées ({used.length})
          </h2>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid #e4e0ec' }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: '#f8f6fc' }}>
                <tr>
                  {['Email', 'Rôle proposé', 'Acceptée le'].map((h) => (
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
                {used.map((inv, i) => (
                  <tr
                    key={inv.id}
                    style={{
                      backgroundColor: i % 2 === 0 ? '#ffffff' : '#fdfcff',
                      borderBottom: i < used.length - 1 ? '1px solid #f0eef8' : 'none',
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: '#353148' }}>{inv.email}</td>
                    <td className="px-4 py-3" style={{ color: '#353148' }}>
                      {ROLE_LABELS[inv.invitedRole] ?? inv.invitedRole}
                    </td>
                    <td className="px-4 py-3" style={{ color: '#8e8a9c' }}>
                      {inv.usedAt ? new Date(inv.usedAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
