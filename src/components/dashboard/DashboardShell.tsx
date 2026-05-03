'use client'

import { useState, useCallback } from 'react'
import { DashboardNav } from './DashboardNav'
import type { UserRole } from '@/db/schema'

interface Props {
  role: UserRole
  userName: string
  children: React.ReactNode
}

export function DashboardShell({ role, userName, children }: Props) {
  const [open, setOpen] = useState(false)
  const close = useCallback(() => setOpen(false), [])

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#f8f6fc' }}>

      {/* ------------------------------------------------------------------ */}
      {/* Mobile overlay — closes sidebar on backdrop tap                     */}
      {/* ------------------------------------------------------------------ */}
      {open && (
        <div
          className="fixed inset-0 z-20 md:hidden"
          style={{ backgroundColor: 'rgba(53, 49, 72, 0.4)' }}
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Sidebar                                                              */}
      {/* Mobile  : fixed overlay, slides in from left                        */}
      {/* Desktop : static, always visible                                    */}
      {/* ------------------------------------------------------------------ */}
      <aside
        style={{ width: 224 }}
        className={[
          // Shared
          'flex-shrink-0 h-full z-30',
          // Mobile: fixed drawer, toggled by `open`
          'fixed inset-y-0 left-0 transition-transform duration-200 ease-in-out',
          open ? 'translate-x-0' : '-translate-x-full',
          // Desktop: undo fixed positioning, always visible
          'md:relative md:translate-x-0',
        ].join(' ')}
      >
        <DashboardNav role={role} userName={userName} onNavigate={close} />
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Main content column                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">

        {/* Mobile top bar */}
        <div
          className="flex items-center gap-3 px-4 h-12 flex-shrink-0 md:hidden"
          style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e4e0ec' }}
        >
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#353148' }}
            aria-label="Ouvrir le menu"
          >
            {/* Hamburger icon */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect y="4"  width="20" height="2" rx="1" fill="currentColor" />
              <rect y="9"  width="20" height="2" rx="1" fill="currentColor" />
              <rect y="14" width="20" height="2" rx="1" fill="currentColor" />
            </svg>
          </button>
          <span className="text-base font-bold" style={{ color: '#353148' }}>ClubOS</span>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
