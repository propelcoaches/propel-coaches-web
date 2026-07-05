'use client'

/**
 * AIOrb — the signature visual of the Propel AI Coach.
 *
 * A layered gradient orb that replaces generic spinners across the product.
 * Three layers stack and animate at different speeds, producing a subtle,
 * living, "thinking" presence instead of a mechanical spinner.
 *
 * Layers:
 *   1. Halo (outer blurred glow, breathes)
 *   2. Core (conic gradient, rotates slowly)
 *   3. Inner highlight (linear gradient, shifts horizontally)
 *   4. Specular dot (top-left, static)
 *
 * States:
 *   • idle      — soft breathe (default when AI is available but not working)
 *   • thinking  — faster breathe + brighter halo + spinning core
 *   • speaking  — wave-style pulse (used during streaming responses)
 *
 * Sizes: sm (24), md (40), lg (72), xl (120)
 */

import clsx from 'clsx'

export type AIOrbSize  = 'sm' | 'md' | 'lg' | 'xl'
export type AIOrbState = 'idle' | 'thinking' | 'speaking'

interface AIOrbProps {
  size?: AIOrbSize
  state?: AIOrbState
  className?: string
  /** If true, the halo glow is disabled (useful inside dense layouts). */
  noHalo?: boolean
  /** Overlay label centered on top of the orb (e.g. a number or icon). */
  label?: React.ReactNode
}

const SIZE_PX: Record<AIOrbSize, number> = {
  sm: 24,
  md: 40,
  lg: 72,
  xl: 120,
}

export default function AIOrb({
  size  = 'md',
  state = 'idle',
  className,
  noHalo = false,
  label,
}: AIOrbProps) {
  const px = SIZE_PX[size]
  const breatheSpeed   = state === 'thinking' ? 'animate-[orbBreathe_1.8s_ease-in-out_infinite]' : 'animate-orb-breathe'
  const rotateSpeed    = state === 'thinking' ? 'animate-[orbRotate_6s_linear_infinite]' : 'animate-orb-rotate'
  const haloIntensity  = state === 'thinking' ? 'opacity-80' : state === 'speaking' ? 'opacity-60' : 'opacity-40'

  return (
    <div
      className={clsx('relative inline-block select-none', className)}
      style={{ width: px, height: px }}
      aria-hidden={label == null}
    >
      {/* Halo — outer blurred glow */}
      {!noHalo && (
        <div
          className={clsx(
            'absolute inset-0 rounded-full blur-xl animate-orb-halo pointer-events-none',
            haloIntensity,
          )}
          style={{
            background: 'radial-gradient(circle at 50% 50%, var(--brand-light) 0%, var(--brand) 50%, transparent 75%)',
            transform: 'scale(1.6)',
          }}
        />
      )}

      {/* Core orb — conic gradient rotates, producing shimmering depth */}
      <div
        className={clsx('absolute inset-0 rounded-full overflow-hidden', breatheSpeed)}
        style={{
          boxShadow: '0 6px 24px -6px rgba(36, 92, 255, 0.45), inset 0 1px 2px rgba(255,255,255,0.4)',
        }}
      >
        {/* Rotating conic gradient — creates iridescent core */}
        <div
          className={clsx('absolute inset-0', rotateSpeed)}
          style={{
            background: `conic-gradient(
              from 0deg,
              var(--brand) 0deg,
              var(--brand-light) 80deg,
              #8be9de 160deg,
              var(--brand-light) 240deg,
              var(--brand) 320deg,
              var(--brand) 360deg
            )`,
          }}
        />

        {/* Linear shift overlay — adds horizontal movement on top of rotation */}
        <div
          className="absolute inset-0 animate-orb-shift mix-blend-overlay opacity-60"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
            backgroundSize: '200% 100%',
          }}
        />

        {/* Specular highlight — static dot that sells the sphere illusion */}
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '15%',
            left: '20%',
            width: '28%',
            height: '28%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 60%)',
            filter: 'blur(1px)',
          }}
        />

        {/* Thin ring — crisp edge that keeps the orb from looking fuzzy */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.35), inset 0 -1px 2px rgba(0,0,0,0.15)',
          }}
        />
      </div>

      {/* Optional centered label (e.g. a count, an icon, or a letter) */}
      {label != null && (
        <div className="absolute inset-0 flex items-center justify-center text-white font-bold pointer-events-none drop-shadow">
          {label}
        </div>
      )}

      {/* Speaking state — emit an expanding ring pulse */}
      {state === 'speaking' && (
        <>
          <span
            className="absolute inset-0 rounded-full border-2 border-brand/40 pointer-events-none animate-pulse-ring"
            style={{ animationDuration: '1.4s' }}
          />
          <span
            className="absolute inset-0 rounded-full border-2 border-brand/30 pointer-events-none animate-pulse-ring"
            style={{ animationDuration: '1.4s', animationDelay: '0.45s' }}
          />
        </>
      )}
    </div>
  )
}
