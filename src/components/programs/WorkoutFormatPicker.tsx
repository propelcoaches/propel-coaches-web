'use client'

import {
  List, Repeat, RotateCw, Clock, Infinity, Timer, Users,
  Hourglass, AlarmClock, Route, Gauge, Wrench, type LucideIcon,
} from 'lucide-react'
import clsx from 'clsx'
import { WorkoutFormat, SportCategory } from '@/types/workout'
import { getSportConfig, FORMAT_CONFIGS } from '@/constants/workoutConfigs'

const ICON_MAP: Record<string, LucideIcon> = {
  List, Repeat, RotateCw, Clock, Infinity, Timer, Users,
  Hourglass, AlarmClock, Route, Gauge, Wrench,
}

interface Props {
  sport: SportCategory
  value: WorkoutFormat
  onChange: (fmt: WorkoutFormat) => void
}

export default function WorkoutFormatPicker({ sport, value, onChange }: Props) {
  const sportCfg = getSportConfig(sport)
  const available = FORMAT_CONFIGS.filter(fc => sportCfg.availableFormats.includes(fc.format))

  return (
    <div className="flex flex-wrap gap-2">
      {available.map(fc => {
        const Icon = ICON_MAP[fc.icon] ?? List
        const selected = value === fc.format
        return (
          <button
            key={fc.format}
            type="button"
            onClick={() => onChange(fc.format)}
            title={fc.description}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all',
              selected
                ? 'bg-brand text-white border-brand shadow-sm'
                : 'bg-surface border-cb-border text-cb-secondary hover:border-brand/40 hover:text-brand hover:bg-brand/5'
            )}
          >
            <Icon size={13} />
            {fc.label}
          </button>
        )
      })}
    </div>
  )
}
