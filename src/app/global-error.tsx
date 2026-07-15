'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex', minHeight: '100vh', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '1rem',
          padding: '1.5rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Something went wrong</h2>
          <p style={{ maxWidth: '28rem', fontSize: '0.875rem', color: '#6b7280' }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            style={{
              borderRadius: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.875rem',
              fontWeight: 500, color: '#fff', background: '#111', border: 'none', cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
