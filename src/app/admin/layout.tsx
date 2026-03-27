'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  TrendingUp,
  Settings,
  Eye,
  EyeOff,
} from 'lucide-react'
import clsx from 'clsx'

type AdminSidebarItem = {
  href: string
  label: string
  icon: React.ComponentType<any>
}

const ADMIN_SECTIONS: AdminSidebarItem[] = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/coaches', label: 'Coaches', icon: Users },
  { href: '/admin/clients', label: 'Clients', icon: ShoppingCart },
  { href: '/admin/revenue', label: 'Revenue', icon: TrendingUp },
  { href: '/admin/system', label: 'System', icon: Settings },
]

function AdminPasswordPrompt({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [showPin, setShowPin] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (process.env.NEXT_PUBLIC_ADMIN_PIN && pin === process.env.NEXT_PUBLIC_ADMIN_PIN) {
      localStorage.setItem('admin_authenticated', 'true')
      onAuthenticate()
    } else {
      setError('Invalid PIN')
      setPin('')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="w-full max-w-md p-8 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Admin Access</h1>
        <p className="text-slate-400 text-center mb-6">Enter PIN to continue</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value)
                setError('')
              }}
              placeholder="Enter PIN"
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
            >
              {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {error && <div className="text-danger text-sm font-medium text-center">{error}</div>}

          <button
            type="submit"
            className="w-full px-4 py-3 bg-teal text-white font-semibold rounded-lg hover:bg-teal/90 transition-colors"
          >
            Authenticate
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-6">
          Restricted to authorized personnel only.
        </p>
      </div>
    </div>
  )
}

function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col h-screen">
      <div className="px-6 py-6 border-b border-gray-800">
        <h2 className="text-white font-bold text-lg">Admin Panel</h2>
        <p className="text-gray-500 text-xs mt-1">Internal Dashboard</p>
      </div>

      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {ADMIN_SECTIONS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                isActive
                  ? 'bg-teal/20 text-teal'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-6 border-t border-gray-800">
        <p className="text-xs text-gray-600 text-center">
          Admin Portal v1.0
        </p>
      </div>
    </aside>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const authenticated = localStorage.getItem('admin_authenticated') === 'true'
    setIsAuthenticated(authenticated)
    setIsChecking(false)
  }, [])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AdminPasswordPrompt onAuthenticate={() => setIsAuthenticated(true)} />
  }

  return (
    <div className="flex h-screen bg-gray-950">
      <AdminSidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-auto bg-gray-950">
          {children}
        </div>
      </main>
    </div>
  )
}
