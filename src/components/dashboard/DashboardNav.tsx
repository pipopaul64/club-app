'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { UserRole } from '@/db/schema'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type NavItem = {
  href: string
  icon: string
  label: string
  /** Extra path prefixes that should light up this item */
  also?: string[]
}

type NavSection = {
  title: string
  items: NavItem[]
  /** Roles that can see this section. undefined = visible to all */
  roles?: UserRole[]
}

// ---------------------------------------------------------------------------
// Nav definition
// ---------------------------------------------------------------------------

const SECTIONS: NavSection[] = [
  {
    title: 'Mon équipe',
    // 'user' couvre tout le monde (rôle implicite). Seuls les managers
    // verront les boutons de création (gérés au niveau des pages).
    roles: ['user', 'manager'],
    items: [
      {
        href:  '/dashboard/team/calendar',
        icon:  '📅',
        label: 'Calendrier',
      },
      {
        href:  '/dashboard/team/convocations',
        icon:  '📣',
        label: 'Convocations',
        also:  ['/dashboard/team/match-sheet'],
      },
      {
        href:  '/dashboard/team/content',
        icon:  '💬',
        label: 'Messages',
      },
    ],
  },
  {
    title: 'Mon club',
    items: [
      {
        href:  '/dashboard/club/content',
        icon:  '💬',
        label: 'Messages',
        also:  ['/dashboard/club/match-sheet'],
      },
      {
        href:  '/dashboard/club/surveys',
        icon:  '🗳️',
        label: 'Sondages',
      },
    ],
  },
  {
    title: 'Administration',
    roles: ['admin'],
    items: [
      {
        href:  '/dashboard/admin/events',
        icon:  '📅',
        label: 'Événements',
      },
      {
        href:  '/dashboard/admin/users',
        icon:  '👥',
        label: 'Licenciés',
      },
      {
        href:  '/dashboard/admin/invitations',
        icon:  '✉️',
        label: 'Invitations',
      },
      {
        href:  '/dashboard/admin/teams',
        icon:  '🏃',
        label: 'Équipes',
      },
      {
        href:  '/dashboard/admin/posts',
        icon:  '📰',
        label: 'Vitrine',
      },
      {
        href:  '/dashboard/admin/surveys',
        icon:  '🗳️',
        label: 'Sondages',
      },
      {
        href:  '/dashboard/admin/finance',
        icon:  '💰',
        label: 'Finances',
        also:  [
          '/dashboard/admin/cotisations',
          '/dashboard/admin/expenses',
          '/dashboard/admin/sponsors',
        ],
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canSeeSection(section: NavSection, roles: UserRole[]): boolean {
  if (!section.roles) return true
  return section.roles.some((r) => roles.includes(r))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  roles: UserRole[]
  userName: string
  /** Called when any nav link is clicked — used by DashboardShell to close the mobile drawer */
  onNavigate?: () => void
}

export function DashboardNav({ roles, userName, onNavigate }: Props) {
  const pathname = usePathname()
  const primaryRole: UserRole =
    roles.includes('admin') ? 'admin' : roles.includes('manager') ? 'manager' : 'user'

  function isActive(item: NavItem): boolean {
    if (pathname === item.href) return true
    if (pathname.startsWith(item.href + '/')) return true
    if (item.also?.some((prefix) => pathname.startsWith(prefix))) return true
    return false
  }

  return (
    <nav
      className="flex flex-col h-full"
      style={{ backgroundColor: '#ffffff', borderRight: '1px solid #e4e0ec' }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="px-5 py-4 flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
        style={{ borderBottom: '1px solid #e4e0ec' }}
      >
        <span className="text-lg font-bold" style={{ color: '#353148' }}>ClubOS</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
        >
          {ROLE_LABELS[primaryRole] ?? primaryRole}
        </span>
      </Link>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {SECTIONS.filter((s) => canSeeSection(s, roles)).map((section) => (
          <div key={section.title} className="px-2">
            <p
              className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ color: '#b0acbc' }}
            >
              {section.title}
            </p>
            <div className="mt-0.5 space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                    style={
                      active
                        ? { backgroundColor: '#f3f0ff', color: '#8c60f3' }
                        : { color: '#353148' }
                    }
                    onMouseEnter={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = '#f8f6fc'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        e.currentTarget.style.backgroundColor = ''
                      }
                    }}
                  >
                    <span className="text-base leading-none">{item.icon}</span>
                    <span>{item.label}</span>
                    {active && (
                      <span
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: '#8c60f3' }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User footer */}
      <div
        className="px-5 py-4 flex-shrink-0"
        style={{ borderTop: '1px solid #e4e0ec' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: '#f3f0ff', color: '#8c60f3' }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate" style={{ color: '#353148' }}>
              {userName}
            </p>
            <p className="text-xs truncate" style={{ color: '#8e8a9c' }}>
              {ROLE_LABELS[primaryRole] ?? primaryRole}
            </p>
          </div>
        </div>
        <a
          href="/api/auth/sign-out"
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-full transition-colors"
          style={{ color: '#8e8a9c' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8f6fc' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '' }}
        >
          <span>←</span>
          <span>Déconnexion</span>
        </a>
      </div>
    </nav>
  )
}

const ROLE_LABELS: Record<UserRole, string> = {
  user:    'Licencié',
  manager: 'Manager',
  admin:   'Admin',
}
