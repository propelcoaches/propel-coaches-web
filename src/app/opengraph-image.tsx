import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Propel Coaches — The All-in-One Coaching Platform'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #6EA0FF 0%, #245CFF 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo circle */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            border: '3px solid rgba(255,255,255,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 36,
          }}
        >
          <span style={{ fontSize: 64, fontWeight: 900, color: '#ffffff' }}>P</span>
        </div>

        {/* Brand name */}
        <p
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            letterSpacing: '-1px',
          }}
        >
          Propel Coaches
        </p>

        {/* Tagline */}
        <p
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.8)',
            margin: '16px 0 0',
            fontWeight: 400,
          }}
        >
          The All-in-One Coaching Platform
        </p>

        {/* Pill tags */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 48,
          }}
        >
          {['Programs', 'Nutrition', 'Check-ins', 'Payments', 'AI Coach'].map((tag) => (
            <div
              key={tag}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 999,
                padding: '8px 20px',
                fontSize: 18,
                color: '#ffffff',
                fontWeight: 500,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
