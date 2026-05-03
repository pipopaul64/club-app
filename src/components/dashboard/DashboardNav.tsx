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
    title: 'Mon espace',
    items: [
      {
        href:  '/dashboard/calendar',
        icon:  '📅',
        label: 'Calendrier',
      },
      {
        href:  '/dashboard/convocations',
        icon:  '📨',
        label: 'Convocations',
        also:  ['/dashboard/match-sheet'],
      },
      {
        href:  '/dashboard/content',
        icon:  '💬',
        label: 'Messages',
      },
      {
        href:  '/dashboard/surveys',
        icon:  '🗳️',
        label: 'Sondages',
      },
    ],
  },
  {
    title: 'Mon équipe',
    roles: ['manager_sportif', 'admin'],
    items: [
      {
        href:  '/dashboard/manager/events/new',
        icon:  '📅',
        label: 'Événements',
        also:  ['/dashboard/manager/events'],
      },
      {
        href:  '/dashboard/manager/convocations',
        icon:  '📣',
        label: 'Convocations',
        also:  ['/dashboard/manager/match-sheet'],
      },
      {
        href:  '/dashboard/manager/content',
        icon:  '📢',
        label: 'Messages',
      },
    ],
  },
  {
    title: 'Associatif',
    roles: ['manager_associatif', 'admin'],
    items: [
      {
        href:  '/dashboard/manager-associatif/expenses',
        icon:  '📤',
        label: 'Mes dépenses',
      },
    ],
  },
  {
    title: 'Administration',
    roles: ['admin'],
    items: [
      {
        href:  '/dashboard/admin/events/new',
        icon:  '📅',
        label: 'Événements',
        also:  ['/dashboard/admin/events'],
      },
      {
        href:  '/dashboard/admin/users',
        icon:  '👥',
        label: 'Licenciés',
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

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  user:               ['user'],
  manager_sportif:    ['user', 'manager_sportif'],
  manager_associatif: ['user', 'manager_associatif'],
  admin:              ['user', 'manager_sportif', 'manager_associatif', 'admin'],
}

function canSeeSection(section: NavSection, role: UserRole): boolean {
  if (!section.roles) return true
  const effective = ROLE_HIERARCHY[role] ?? ['user']
  return section.roles.some((r) => effective.includes(r))
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  role: UserRole
  userName: string
}

export function DashboardNav({ role, userName }: Props) {
  const pathname = usePathname()

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
        className="px-5 py-4 flex items-center gap-2 flex-shrink-0 hover:opacity-80 transition-opacity"
        style={{ borderBottom: '1px solid #e4e0ec' }}
      >
        <span className="text-lg font-bold" style={{ color: '#353148' }}>ClubOS</span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ color: '#8c60f3', backgroundColor: '#f3f0ff' }}
        >
          {ROLE_LABELS[role] ?? role}
        </span>
      </Link>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1">
        {SECTIONS.filter((s) => canSeeSection(s, role)).map((section) => (
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
              {ROLE_LABELS[role] ?? role}
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
  user:               'Licencié',
  manager_sportif:    'Manager sportif',
  manager_associatif: 'Manager associatif',
  admin:              'Admin',
}
