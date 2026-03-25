'use client'

import Link from 'next/link'
import { exitDemo } from '@/lib/demo/useDemoMode'
import { useIsDemo } from '@/lib/demo/useDemoMode'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const isDemo = useIsDemo()

  const handleSignOut = () => {
    if (isDemo) {
      exitDemo()
    } else {
      // Handle real sign out
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/client" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              <span className="text-xl font-semibold text-gray-900">Propel</span>
            </Link>

            {/* Right side: Client name and sign out */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-teal-600">LC</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">Liam Carter</p>
                  <p className="text-xs text-gray-500">Client</p>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="bg-white min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  )
}
