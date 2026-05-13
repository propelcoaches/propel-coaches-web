'use client'
import React, { useState, useEffect } from 'react'
import { Cookie } from 'lucide-react'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('propel_cookie_consent')
    if (!consent) setVisible(true)
  }, [])

  const accept = (all: boolean) => {
    localStorage.setItem('propel_cookie_consent', all ? 'all' : 'essential')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-3 left-3 z-50 w-[calc(100%-1.5rem)] max-w-xl md:bottom-5 md:left-5">
      <div className="rounded-2xl border border-teal-900/10 bg-white/95 p-3 shadow-2xl shadow-slate-950/12 backdrop-blur-xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-50">
              <Cookie className="h-4 w-4 text-teal-700" />
            </div>
            <div className="min-w-0">
              <div className="font-black leading-tight text-slate-950">Cookie preferences</div>
              <div className="mt-0.5 text-xs leading-5 text-slate-500">
                Essential cookies keep Propel running. Optional analytics improve the product.
                {' '}<button onClick={() => setShowDetails(!showDetails)} className="font-bold text-teal-700 hover:underline">
                  {showDetails ? 'Hide details' : 'Details'}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-shrink-0 gap-2 sm:ml-auto">
            <button onClick={() => accept(true)} className="rounded-full bg-teal-700 px-4 py-2 text-xs font-black text-white transition-colors hover:bg-teal-800">
              Accept All
            </button>
            <button onClick={() => accept(false)} className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition-colors hover:bg-slate-50">
              Essential Only
            </button>
          </div>
        </div>
        {showDetails && (
          <div className="mt-3 space-y-2 rounded-2xl bg-slate-50 p-3 text-sm leading-5 text-slate-600">
            <p><strong>Essential:</strong> Authentication, session management, security (always active)</p>
            <p><strong>Analytics:</strong> PostHog usage analytics to improve product features (optional)</p>
            <p><strong>No advertising cookies</strong> are ever used on Propel.</p>
          </div>
        )}
      </div>
    </div>
  )
}
