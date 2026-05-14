import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import Link from 'next/link'
import type { SessionUser } from '@/types'

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user as unknown as SessionUser

  return (
    <div>
      {/* Page header */}
      <div
        className="px-8 py-5"
        style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e0ec' }}
      >
        <h1 className="text-xl font-bold" style={{ color: '#353148' }}>
          Bonjour, {user.name} 👋
        </h1>
        <p className="text-sm mt-0.5" style={{ color: '#8e8a9c' }}>
          Bienvenue sur votre tableau de bord ClubOS
        </p>
      </div>

      {/* Body */}
      <div className="p-8 max-w-2xl space-y-6">
        <QuickLinks roles={user.roles} />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Accès rapides contextuels
// ---------------------------------------------------------------------------

function QuickLinks({ roles }: { roles: string[] }) {
  const links: { href: string; icon: string; title: string; desc: string }[] = [
    { href: '/dashboard/team/calendar', icon: '📅', title: 'Calendrier', desc: 'Calendrier de mon équipe' },
    { href: '/dashboard/club/content',  icon: '💬', title: 'Messages',   desc: 'Messages du club' },
    { href: '/dashboard/club/surveys',  icon: '🗳️', title: 'Sondages',   desc: 'Répondre aux sondages en cours' },
  ]

  if (roles.includes('manager')) {
    links.push(
      { href: '/dashboard/team/convocations', icon: '📣', title: 'Gérer convocations', desc: "Convoquer et composer l'équipe" },
      { href: '/dashboard/team/content',      icon: '📢', title: 'Envoyer un message', desc: "Communiquer avec l'équipe" },
    )
  }

  if (roles.includes('admin')) {
    links.push(
      { href: '/dashboard/admin/users',   icon: '👥', title: 'Licenciés', desc: 'Gérer les membres du club' },
      { href: '/dashboard/admin/finance', icon: '💰', title: 'Finances',  desc: 'Cotisations, dépenses, sponsors' },
    )
  }

  return (
    <div>
      <h2 className="text-sm font-semibold mb-3" style={{ color: '#8e8a9c' }}>
        Accès rapides
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-xl p-4 flex items-start gap-3 transition-shadow hover:shadow-sm"
            style={{ backgroundColor: '#ffffff', border: '1px solid #e4e0ec' }}
          >
            <span className="text-xl flex-shrink-0">{l.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: '#353148' }}>{l.title}</p>
              <p className="text-xs mt-0.5 leading-snug" style={{ color: '#8e8a9c' }}>{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
