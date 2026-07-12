'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, Users, Dumbbell, UtensilsCrossed, SquareCheck, ChevronDown, Menu } from 'lucide-react'
import clsx from 'clsx'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':              'Dashboard',
  '/clients':                'Clients',
  '/training':               'Programs',
  '/nutrition':              'Nutrition',
  '/settings':               'Settings',
  '/check-ins':              'Check-ins',
  '/tasks':                  'Tasks',
  '/messages':               'Messages',
  '/metrics':                'Metrics',
  '/habits':                 'Habits',
  '/resources':              'Resources',
  '/autoflow':               'Autoflow',
  '/notifications':          'Notifications',
  '/notifications-broadcast':'Broadcasts',
  '/my-plan':                'My Meal Plan',
  '/my-workout':             'My Training',
  '/my-nutrition':           'My Nutrition',
  '/programs':               'Programs',
  '/meal-plans':             'Nutrition',
  '/workout-programs':       'Programs',
  '/packages':               'Packages',
  '/team':                   'Team',
  '/form-check':             'Form Check',
  '/branding':               'Branding',
  '/payments':               'Payments',
  '/templates':              'Templates',
  '/tags':                   'Tags & Segments',
  '/video-library':          'Video Library',
  '/reviews':                'Reviews',
  '/marketplace':            'Marketplace',
  '/referrals':              'Referrals',
  '/groups':                 'Group Chats',
  '/email-sequences':        'Email Sequences',
  '/privacy':                'Privacy & Data',
}

function getTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  for (const [prefix, label] of Object.entries(PAGE_TITLES)) {
    if (pathname.startsWith(prefix + '/')) return label
  }
  return 'Coach Portal'
}

const QUICK_ACTIONS = [
  { label: 'New Client',    href: '/clients',   icon: Users,           desc: 'Add a coaching client' },
  { label: 'New Program',   href: '/programs',  icon: Dumbbell,        desc: 'Build a workout program' },
  { label: 'New Meal Plan', href: '/nutrition', icon: UtensilsCrossed, desc: 'Create a nutrition plan' },
  { label: 'New Task',      href: '/tasks',     icon: SquareCheck,     desc: 'Add a task or reminder' },
]

export default function TopBar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const title = getTitle(pathname)

  return (
    <div className="flex-shrink-0 h-16 flex items-center justify-between px-4 sm:px-8 border-b border-cb-border bg-surface">
      <div className="flex items-center gap-2">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-1 rounded-lg text-cb-muted hover:bg-surface-light hover:text-cb-secondary transition-colors"
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
        )}
        <h1 className="text-lg font-semibold text-cb-text">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search bar (decorative) */}
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-light border border-cb-border rounded-lg text-cb-muted">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="m12 12 2 2" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="w-40 bg-transparent text-sm text-cb-text placeholder-cb-muted focus:outline-none"
            disabled
          />
        </div>

        {/* Quick Add dropdown */}
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand/90 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={15} />
            <span>Add</span>
            <ChevronDown size={13} className={clsx('transition-transform duration-150', open && 'rotate-180')} />
          </button>

          {open && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-cb-border rounded-xl shadow-lg z-20 overflow-hidden py-1">
                {QUICK_ACTIONS.map((a) => {
                  const Icon = a.icon
                  return (
                    <button
                      key={a.label}
                      onClick={() => { router.push(a.href); setOpen(false) }}
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-surface-light transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center flex-shrink-0">
                        <Icon size={15} className="text-brand" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cb-text">{a.label}</p>
                        <p className="text-xs text-cb-muted">{a.desc}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
