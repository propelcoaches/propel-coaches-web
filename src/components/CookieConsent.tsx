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
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900">We use cookies</div>
            <div className="text-gray-500 text-sm mt-0.5">
              We use essential cookies to run the platform and optional analytics cookies to improve your experience.
              {' '}<button onClick={() => setShowDetails(!showDetails)} className="text-purple-600 hover:underline text-sm">
                {showDetails ? 'Hide details' : 'View details'}
              </button>
            </div>
          </div>
        </div>
        {showDetails && (
          <div className="mb-4 pl-11 space-y-2 text-sm text-gray-600">
            <p><strong>Essential:</strong> Authentication, session management, security (always active)</p>
            <p><strong>Analytics:</strong> PostHog usage analytics to improve product features (optional)</p>
            <p><strong>No advertising cookies</strong> are ever used on Propel.</p>
          </div>
        )}
        <div className="flex gap-2 pl-11">
          <button onClick={() => accept(true)} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Accept All
          </button>
          <button onClick={() => accept(false)} className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            Essential Only
          </button>
        </div>
      </div>
    </div>
  )
}
