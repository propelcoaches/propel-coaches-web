'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { exitDemo } from '@/lib/demo/useDemoMode'
import { useTheme } from '@/contexts/ThemeContext'
import clsx from 'clsx'
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  UtensilsCrossed,
  Settings,
  LogOut,
  Sun,
  Moon,
  Bell,
  MessageSquare,
  ClipboardCheck,
  HeartPulse,
  BookOpen,
  ListTodo,
  CreditCard,
  Mail,
  Gift,
  Shield,
  Megaphone,
  Video,
  MessageSquareText,
  Tag,
  Film,
  Star,
  ShoppingBag,
  Palette,
  Package,
  UsersRound,
  CalendarClock,
  Watch,
} from 'lucide-react'

type NavSection = {
  label?: string
  items: Array<{ href: string; label: string; icon: React.ComponentType<any> }>
}

const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'CLIENTS',
    items: [
      { href: '/clients', label: 'Clients', icon: Users },
      { href: '/messages', label: 'Messages', icon: MessageSquare },
      { href: '/check-ins', label: 'Check-ins', icon: ClipboardCheck },
    ],
  },
  {
    label: 'AI & AUTOMATION',
    items: [
      { href: '/meal-plans', label: 'Meal Plans', icon: UtensilsCrossed },
      { href: '/workout-programs', label: 'Workout Programs', icon: Dumbbell },
      { href: '/form-check', label: 'Form Check', icon: Video },
    ],
  },
  {
    label: 'COACHING',
    items: [
      { href: '/programs', label: 'Programs', icon: BookOpen },
      { href: '/nutrition', label: 'Nutrition', icon: HeartPulse },
      { href: '/templates', label: 'Templates', icon: MessageSquareText },
      { href: '/tags', label: 'Tags & Segments', icon: Tag },
      { href: '/video-library', label: 'Video Library', icon: Film },
      { href: '/habits', label: 'Habits', icon: ListTodo },
      { href: '/resources', label: 'Resources', icon: BookOpen },
      { href: '/tasks', label: 'Tasks', icon: ListTodo },
    ],
  },
  {
    label: 'GROWTH',
    items: [
      { href: '/reviews', label: 'Reviews', icon: Star },
      { href: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
      { href: '/packages', label: 'Packages', icon: Package },
      { href: '/referrals', label: 'Referrals', icon: Gift },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { href: '/payments', label: 'Payments', icon: CreditCard },
      { href: '/groups', label: 'Group Chats', icon: UsersRound },
      { href: '/email-sequences', label: 'Email Sequences', icon: Mail },
      { href: '/notifications', label: 'Notifications', icon: Bell },
      { href: '/notifications-broadcast', label: 'Broadcasts', icon: Megaphone },
      { href: '/team', label: 'Team', icon: Users },
    ],
  },
  {
    label: 'SETTINGS',
    items: [
      { href: '/branding', label: 'Branding', icon: Palette },
      { href: '/settings', label: 'Settings', icon: Settings },
      { href: '/privacy', label: 'Privacy & Data', icon: Shield },
    ],
  },
]

export default function Sidebar({ userEmail, isDemo }: { userEmail?: string | null; isDemo?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()

  async function handleLogout() {
    if (isDemo) {
      exitDemo()
      return
    }
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname === href || pathname.startsWith(href + '/')
  }

  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : 'CB'

  return (
    <aside className="w-[220px] flex-shrink-0 bg-surface border-r border-cb-border flex flex-col h-screen">
      {/* Minimal Header */}
      <div className="px-5 py-5 border-b border-cb-border">
        <div className="flex items-center gap-2.5">
          <img
            src={theme === 'dark' ? '/logo/icon-dark.png' : '/logo/icon-light.png'}
            alt="Propel"
            className="w-7 h-7 object-contain flex-shrink-0"
          />
          <span className="font-bold text-cb-text text-sm tracking-tight">Propel</span>
        </div>
        {isDemo && (
          <div className="mt-3 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-[10px] font-semibold text-center dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
            Demo Mode
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 overflow-y-auto">
        <div className="space-y-6">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={idx}>
              {section.label && (
                <div className="section-label">
                  {section.label}
                </div>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={clsx(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? 'bg-brand text-white'
                            : 'text-cb-secondary hover:bg-surface-light hover:text-cb-text'
                        )}
                      >
                        <Icon
                          size={16}
                          className="flex-shrink-0"
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-cb-border space-y-2">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-brand">{initials}</span>
          </div>
          <span className="text-xs text-cb-secondary truncate flex-1">{userEmail ?? 'Coach'}</span>
          <button
            onClick={toggleTheme}
            className="flex-shrink-0 p-1.5 rounded-md text-cb-muted hover:text-cb-secondary hover:bg-surface-light transition-colors"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-cb-secondary hover:bg-surface-light hover:text-cb-text transition-colors"
        >
          <LogOut size={15} className="text-cb-muted flex-shrink-0" />
          <span className="truncate">{isDemo ? 'Exit Demo' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}
