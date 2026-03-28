'use client'

import {
  Dumbbell, Footprints, Bike, Waves, Flame, Trophy,
  HeartPulse, Zap, Flower2, type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { SportCategory } from '@/types/workout'
import { SPORT_CONFIGS } from '@/constants/workoutConfigs'

const ICON_MAP: Record<string, LucideIcon> = {
  Dumbbell, Footprints, Bike, Waves, Flame, Trophy,
  HeartPulse, Zap, Flower2,
}

interface Props {
  value: SportCategory | null
  onChange: (cat: SportCategory) => void
}

export default function SportCategoryPicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SPORT_CONFIGS.map(cfg => {
        const Icon = ICON_MAP[cfg.icon] ?? Dumbbell
        const selected = value === cfg.category
        return (
          <button
            key={cfg.category}
            type="button"
            onClick={() => onChange(cfg.category)}
            className={clsx(
              'relative flex flex-col items-start gap-1.5 p-4 rounded-xl border text-left transition-all',
              selected
                ? 'border-brand bg-brand/8 ring-1 ring-brand/30'
                : 'border-cb-border bg-surface hover:border-brand/40 hover:bg-surface-light'
            )}
          >
            <div className={clsx(
              'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
              selected ? 'bg-brand text-white' : 'bg-surface-light text-cb-secondary'
            )}>
              <Icon size={18} />
            </div>
            <div>
              <p className={clsx('text-sm font-semibold leading-tight', selected ? 'text-brand' : 'text-cb-text')}>
                {cfg.label}
              </p>
              <p className="text-[11px] text-cb-muted leading-snug mt-0.5">{cfg.description}</p>
            </div>
            {selected && (
              <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-brand flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5 text-white fill-current">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
