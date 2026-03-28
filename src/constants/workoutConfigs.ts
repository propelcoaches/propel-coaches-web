import { SportFieldConfig, FormatConfig, SportCategory, WorkoutFormat } from '@/types/workout';

export const SPORT_CONFIGS: SportFieldConfig[] = [
  {
    category: 'strength',
    label: 'Strength / Gym',
    icon: 'Dumbbell',
    description: 'Resistance training, bodybuilding, powerlifting',
    availableFormats: ['straight_sets', 'superset', 'circuit', 'emom', 'amrap', 'ygig', 'custom'],
    defaultFormat: 'straight_sets',
    exerciseFields: {
      sets: true, reps: true, weight: true, rest: true,
      duration: false, distance: false, pace: false, calories: false,
      tempo: true, rpe: true, heartRateZone: false, intervals: false,
      cues: true, videoRef: true,
    },
  },
  {
    category: 'running',
    label: 'Running / Endurance',
    icon: 'Footprints',
    description: 'Road running, trail, track, endurance',
    availableFormats: ['distance', 'interval', 'timed', 'tempo', 'custom'],
    defaultFormat: 'distance',
    exerciseFields: {
      sets: false, reps: false, weight: false, rest: true,
      duration: true, distance: true, pace: true, calories: true,
      tempo: false, rpe: true, heartRateZone: true, intervals: true,
      cues: true, videoRef: false,
    },
  },
  {
    category: 'cycling',
    label: 'Cycling',
    icon: 'Bike',
    description: 'Road cycling, spinning, indoor bike',
    availableFormats: ['distance', 'interval', 'timed', 'custom'],
    defaultFormat: 'timed',
    exerciseFields: {
      sets: false, reps: false, weight: false, rest: true,
      duration: true, distance: true, pace: true, calories: true,
      tempo: false, rpe: true, heartRateZone: true, intervals: true,
      cues: true, videoRef: false,
    },
  },
  {
    category: 'swimming',
    label: 'Swimming',
    icon: 'Waves',
    description: 'Pool swimming, open water, drills',
    availableFormats: ['distance', 'interval', 'timed', 'custom'],
    defaultFormat: 'distance',
    exerciseFields: {
      sets: true, reps: true, weight: false, rest: true,
      duration: true, distance: true, pace: true, calories: false,
      tempo: false, rpe: true, heartRateZone: true, intervals: true,
      cues: true, videoRef: false,
    },
  },
  {
    category: 'functional',
    label: 'Functional / CrossFit',
    icon: 'Flame',
    description: 'WODs, functional fitness, competitive fitness',
    availableFormats: ['emom', 'amrap', 'for_time', 'circuit', 'interval', 'ygig', 'straight_sets', 'custom'],
    defaultFormat: 'amrap',
    exerciseFields: {
      sets: true, reps: true, weight: true, rest: true,
      duration: true, distance: true, pace: false, calories: true,
      tempo: false, rpe: true, heartRateZone: false, intervals: true,
      cues: true, videoRef: true,
    },
  },
  {
    category: 'sports_specific',
    label: 'Sports Conditioning',
    icon: 'Trophy',
    description: 'Team sports, drills, agility, sport-specific prep',
    availableFormats: ['circuit', 'interval', 'timed', 'straight_sets', 'custom'],
    defaultFormat: 'circuit',
    exerciseFields: {
      sets: true, reps: true, weight: false, rest: true,
      duration: true, distance: true, pace: false, calories: false,
      tempo: false, rpe: true, heartRateZone: true, intervals: true,
      cues: true, videoRef: true,
    },
  },
  {
    category: 'rehab',
    label: 'Rehab / Mobility',
    icon: 'HeartPulse',
    description: 'Physiotherapy, injury rehab, mobility, corrective exercise',
    availableFormats: ['straight_sets', 'timed', 'tempo', 'circuit', 'custom'],
    defaultFormat: 'tempo',
    exerciseFields: {
      sets: true, reps: true, weight: false, rest: true,
      duration: true, distance: false, pace: false, calories: false,
      tempo: true, rpe: true, heartRateZone: false, intervals: false,
      cues: true, videoRef: true,
    },
  },
  {
    category: 'hiit',
    label: 'HIIT / Cardio',
    icon: 'Zap',
    description: 'High intensity intervals, tabata, cardio sessions',
    availableFormats: ['interval', 'emom', 'amrap', 'circuit', 'for_time', 'timed', 'custom'],
    defaultFormat: 'interval',
    exerciseFields: {
      sets: false, reps: true, weight: false, rest: true,
      duration: true, distance: false, pace: false, calories: true,
      tempo: false, rpe: true, heartRateZone: true, intervals: true,
      cues: true, videoRef: true,
    },
  },
  {
    category: 'yoga_pilates',
    label: 'Yoga / Pilates',
    icon: 'Flower2',
    description: 'Yoga flows, Pilates, stretching, breathwork',
    availableFormats: ['timed', 'straight_sets', 'custom'],
    defaultFormat: 'timed',
    exerciseFields: {
      sets: true, reps: true, weight: false, rest: false,
      duration: true, distance: false, pace: false, calories: false,
      tempo: true, rpe: false, heartRateZone: false, intervals: false,
      cues: true, videoRef: true,
    },
  },
];

export const FORMAT_CONFIGS: FormatConfig[] = [
  { format: 'straight_sets', label: 'Straight Sets', icon: 'List', description: 'Traditional sets and reps', hasRounds: false, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'sequential' },
  { format: 'superset', label: 'Superset', icon: 'Repeat', description: 'Paired exercises back to back', hasRounds: true, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'paired' },
  { format: 'circuit', label: 'Circuit', icon: 'RotateCw', description: 'Multiple exercises in rounds', hasRounds: true, hasTimeLimit: false, hasStations: true, hasWorkRestRatio: true, hasPartner: false, grouping: 'circuit' },
  { format: 'emom', label: 'EMOM', icon: 'Clock', description: 'Every Minute On the Minute', hasRounds: false, hasTimeLimit: true, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'per_minute' },
  { format: 'amrap', label: 'AMRAP', icon: 'Infinity', description: 'As Many Rounds As Possible', hasRounds: false, hasTimeLimit: true, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'circuit' },
  { format: 'interval', label: 'Intervals', icon: 'Timer', description: 'Work/rest interval blocks', hasRounds: true, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: true, hasPartner: false, grouping: 'sequential' },
  { format: 'ygig', label: 'YGIG', icon: 'Users', description: 'You Go I Go — partner alternating', hasRounds: true, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: true, grouping: 'sequential' },
  { format: 'for_time', label: 'For Time', icon: 'Hourglass', description: 'Complete the work as fast as possible', hasRounds: true, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'circuit' },
  { format: 'timed', label: 'Timed Session', icon: 'AlarmClock', description: 'Fixed duration blocks', hasRounds: false, hasTimeLimit: true, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'sequential' },
  { format: 'distance', label: 'Distance-Based', icon: 'Route', description: 'Distance targets with pace', hasRounds: false, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'sequential' },
  { format: 'tempo', label: 'Tempo / Control', icon: 'Gauge', description: 'Controlled tempo and ROM focus', hasRounds: false, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'sequential' },
  { format: 'custom', label: 'Custom', icon: 'Wrench', description: 'Freeform — build your own structure', hasRounds: false, hasTimeLimit: false, hasStations: false, hasWorkRestRatio: false, hasPartner: false, grouping: 'freeform' },
];

export const getSportConfig = (cat: SportCategory): SportFieldConfig =>
  SPORT_CONFIGS.find(c => c.category === cat)!;

export const getFormatConfig = (fmt: WorkoutFormat): FormatConfig =>
  FORMAT_CONFIGS.find(c => c.format === fmt)!;

// Sport category accent colours (subtle tinted borders)
export const SPORT_ACCENT_COLORS: Record<SportCategory, string> = {
  strength:       'border-brand',
  running:        'border-emerald-500',
  cycling:        'border-lime-500',
  swimming:       'border-cyan-500',
  functional:     'border-orange-500',
  sports_specific:'border-yellow-500',
  rehab:          'border-blue-500',
  hiit:           'border-red-500',
  yoga_pilates:   'border-violet-500',
};

export const SPORT_ACCENT_BG: Record<SportCategory, string> = {
  strength:       'bg-brand/8',
  running:        'bg-emerald-500/8',
  cycling:        'bg-lime-500/8',
  swimming:       'bg-cyan-500/8',
  functional:     'bg-orange-500/8',
  sports_specific:'bg-yellow-500/8',
  rehab:          'bg-blue-500/8',
  hiit:           'bg-red-500/8',
  yoga_pilates:   'bg-violet-500/8',
};
