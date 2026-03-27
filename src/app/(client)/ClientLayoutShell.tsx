'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  children: React.ReactNode
  brandName: string | null
  logoUrl: string | null
  accentColor: string | null
  secondaryColor: string | null
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function lightenHex(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const lr = Math.round(r + (255 - r) * 0.85)
  const lg = Math.round(g + (255 - g) * 0.85)
  const lb = Math.round(b + (255 - b) * 0.85)
  return `rgb(${lr},${lg},${lb})`
}

export default function ClientLayoutShell({ children, brandName, logoUrl, accentColor, secondaryColor }: Props) {
  const [clientName, setClientName] = useState('')
  const [initials, setInitials] = useState('CL')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.full_name) {
            setClientName(data.full_name)
            const parts = data.full_name.split(' ')
            setInitials(parts.map((p: string) => p[0]).join('').slice(0, 2).toUpperCase())
          }
        })
    })
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const primary = accentColor ?? '#0F7B8C'
  const secondary = secondaryColor ?? '#1A95A8'

  // Build CSS custom property overrides from coach branding
  const cssVars = {
    '--brand': primary,
    '--brand-light': secondary,
    '--brand-bg': lightenHex(primary),
  } as React.CSSProperties

  const displayName = brandName || 'Propel'
  const firstLetter = displayName[0].toUpperCase()

  return (
    <div className="min-h-screen bg-white" style={cssVars}>
      {/* Top Navigation Bar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo / Brand */}
            <Link href="/client" className="flex items-center gap-2">
              {logoUrl ? (
                <img src={logoUrl} alt={displayName} className="h-8 object-contain max-w-[140px]" />
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: primary }}
                  >
                    {firstLetter}
                  </div>
                  <span className="text-xl font-semibold text-gray-900">{displayName}</span>
                </>
              )}
            </Link>

            {/* Right side: Client name and sign out */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: hexToRgba(primary, 0.12) }}
                >
                  <span className="text-sm font-semibold" style={{ color: primary }}>{initials}</span>
                </div>
                {clientName && (
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{clientName}</p>
                    <p className="text-xs text-gray-500">Client</p>
                  </div>
                )}
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
