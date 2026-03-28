// ─── SPORT CATEGORIES ───
export type SportCategory =
  | 'strength'
  | 'running'
  | 'cycling'
  | 'swimming'
  | 'functional'
  | 'sports_specific'
  | 'rehab'
  | 'hiit'
  | 'yoga_pilates';

// ─── WORKOUT FORMATS ───
export type WorkoutFormat =
  | 'straight_sets'
  | 'superset'
  | 'circuit'
  | 'emom'
  | 'amrap'
  | 'interval'
  | 'ygig'
  | 'for_time'
  | 'timed'
  | 'distance'
  | 'tempo'
  | 'custom';

// ─── FIELD CONFIGS PER SPORT ───
export interface SportFieldConfig {
  category: SportCategory;
  label: string;
  icon: string;
  description: string;
  availableFormats: WorkoutFormat[];
  defaultFormat: WorkoutFormat;
  exerciseFields: {
    sets: boolean;
    reps: boolean;
    weight: boolean;
    rest: boolean;
    duration: boolean;
    distance: boolean;
    pace: boolean;
    calories: boolean;
    tempo: boolean;
    rpe: boolean;
    heartRateZone: boolean;
    intervals: boolean;
    cues: boolean;
    videoRef: boolean;
  };
}

// ─── FORMAT CONFIGS ───
export interface FormatConfig {
  format: WorkoutFormat;
  label: string;
  icon: string;
  description: string;
  hasRounds: boolean;
  hasTimeLimit: boolean;
  hasStations: boolean;
  hasWorkRestRatio: boolean;
  hasPartner: boolean;
  grouping: 'sequential' | 'paired' | 'circuit' | 'per_minute' | 'freeform';
}

// ─── EXERCISE BLOCK ───
export interface ExerciseBlock {
  id: string;
  exerciseName: string;
  exerciseId?: string;
  videoUrl?: string;
  sets?: number;
  reps?: string;
  weight?: string;
  restSeconds?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  pace?: string;
  tempo?: string;
  rpe?: number;
  heartRateZone?: number;
  calories?: number;
  coachNotes?: string;
  order: number;
}

// ─── WORKOUT SECTION ───
export interface WorkoutSection {
  id: string;
  title?: string;
  format: WorkoutFormat;
  rounds?: number;
  timeLimitSeconds?: number;
  workSeconds?: number;
  restSeconds?: number;
  exercises: ExerciseBlock[];
  order: number;
}

// ─── FULL WORKOUT ───
export interface Workout {
  id: string;
  title: string;
  sportCategory: SportCategory;
  description?: string;
  estimatedDuration?: number;
  sections: WorkoutSection[];
  coachNotes?: string;
}
