'use client'

import { WorkoutSection, SportCategory } from '@/types/workout'
import StraightSetsSection from './StraightSetsSection'
import SupersetSection from './SupersetSection'
import CircuitSection from './CircuitSection'
import EMOMSection from './EMOMSection'
import AMRAPSection from './AMRAPSection'
import IntervalSection from './IntervalSection'
import YGIGSection from './YGIGSection'
import ForTimeSection from './ForTimeSection'
import TimedSection from './TimedSection'
import DistanceSection from './DistanceSection'
import TempoSection from './TempoSection'
import CustomSection from './CustomSection'

interface Props {
  section: WorkoutSection
  sport: SportCategory
  onChange: (s: WorkoutSection) => void
}

export default function SectionBuilder({ section, sport, onChange }: Props) {
  const props = { section, sport, onChange }

  switch (section.format) {
    case 'straight_sets': return <StraightSetsSection {...props} />
    case 'superset':      return <SupersetSection {...props} />
    case 'circuit':       return <CircuitSection {...props} />
    case 'emom':          return <EMOMSection {...props} />
    case 'amrap':         return <AMRAPSection {...props} />
    case 'interval':      return <IntervalSection {...props} />
    case 'ygig':          return <YGIGSection {...props} />
    case 'for_time':      return <ForTimeSection {...props} />
    case 'timed':         return <TimedSection {...props} />
    case 'distance':      return <DistanceSection {...props} />
    case 'tempo':         return <TempoSection {...props} />
    case 'custom':
    default:              return <CustomSection {...props} />
  }
}
