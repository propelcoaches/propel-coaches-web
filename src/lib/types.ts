export type Profile = {
  id: string
  role: 'client' | 'coach'
  name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
  coach_id: string | null
  date_of_birth: string | null
  gender: string | null
  height_cm: number | null
  starting_weight_kg: number | null
  current_weight_kg: number | null
  target_weight_kg: number | null
  goal: string | null
  goal_timeline: string | null
  dietary_preferences: string[] | null
  training_days_per_week: number | null
  training_history: string | null
  injuries: string | null
  onboarding_completed: boolean
  business_name: string | null
  bio: string | null
  specialisations: string[] | null
  created_at: string
  updated_at: string
}

export type CheckIn = {
  id: string
  client_id: string
  date: string
  energy: number | null
  stress: number | null
  sleep_quality: number | null
  training_difficulty: number | null
  digestion: number | null
  bodyweight_kg: number | null
  wins: string | null
  struggles: string | null
  coach_comment: string | null
  loom_url: string | null
  submitted: boolean
  created_at: string
  photo_front_url: string | null
  photo_side_url: string | null
  photo_back_url: string | null
}

export type Message = {
  id: string
  coach_id: string
  client_id: string
  sender_id: string
  sender_role: 'coach' | 'client'
  content: string
  message_type: string
  read: boolean
  created_at: string
}

export type CoachNote = {
  id: string
  coach_id: string
  client_id: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
}

export type WeightLog = {
  id: string
  client_id: string
  weight_kg: number
  date: string
  body_fat_pct: number | null
  notes: string | null
  created_at: string
}

export type WorkoutProgram = {
  id: string
  client_id: string
  coach_id: string | null
  name: string
  description: string | null
  goal: string | null
  weeks: number
  current_week: number
  days_per_week: number
  is_active: boolean
  ai_generated: boolean
  coach_approved: boolean
  created_at: string
  updated_at: string
}

export type WorkoutDay = {
  id: string
  program_id: string
  day_number: number
  name: string
  completed: boolean
  completed_at: string | null
  notes: string | null
  created_at: string
}

export type WorkoutExercise = {
  id: string
  day_id: string
  name: string
  muscle_group: string | null
  movement_pattern: string | null
  equipment: string | null
  order_index: number
  rest_seconds: number
  notes: string | null
  sets: ExerciseSet[]
  created_at: string
}

export type ExerciseSet = {
  id: string
  exercise_id: string
  set_number: number
  target_reps: number
  target_weight_kg: number | null
  actual_reps: number | null
  actual_weight_kg: number | null
  completed: boolean
  created_at: string
}

export type MacroTargets = {
  id: string
  client_id: string
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  fibre_g: number | null
  water_ml: number | null
  set_by_coach: boolean
  coach_notes: string | null
  created_at: string
  updated_at: string
}

export type FoodLog = {
  id: string
  client_id: string
  date: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  name: string
  calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  created_at: string
}

export type ProgressPhoto = {
  id: string
  client_id: string
  date: string
  angle: string | null
  storage_path: string
  public_url: string | null
  weight_kg: number | null
  notes: string | null
  visible_to_coach: boolean
  created_at: string
}

export type PersonalRecord = {
  id: string
  client_id: string
  exercise_name: string
  weight_kg: number
  reps: number
  estimated_1rm: number | null
  date: string
  created_at: string
}

export type ClientInvitation = {
  id: string
  coach_id: string
  client_email: string
  client_name: string
  goal: string | null
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
}

// ── Meal Plans ──

export type MealPlan = {
  id: string
  coach_id: string
  client_id: string | null
  name: string
  description: string | null
  plan_type: 'meal' | 'macros'
  calories_target: number | null
  protein_target: number | null
  carbs_target: number | null
  fats_target: number | null
  is_template: boolean
  created_at: string
  updated_at: string
}

export type MealPlanDay = {
  id: string
  plan_id: string
  day_number: number
  day_name: string
  total_calories: number | null
  created_at: string
}

export type MealPlanMeal = {
  id: string
  day_id: string
  meal_name: string
  order_index: number
  created_at: string
}

export type MealPlanFood = {
  id: string
  meal_id: string
  name: string
  quantity: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fats_g: number | null
  notes: string | null
  created_at: string
}

// ── Tasks ──

export type Task = {
  id: string
  coach_id: string
  client_id: string | null
  title: string
  description: string | null
  due_date: string | null
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  created_at: string
}

// ── Autoflow ──

export type Autoflow = {
  id: string
  coach_id: string
  client_id: string | null
  name: string
  trigger_type: 'day' | 'event' | 'manual'
  trigger_day: number | null
  events: AutoflowEvent[]
  is_active: boolean
  created_at: string
}

export type AutoflowEvent = {
  id: string
  autoflow_id: string
  event_type: 'workout_program' | 'resources' | 'message' | 'email' | 'notification' | 'note'
  day_offset: number
  payload: Record<string, unknown>
  created_at: string
}

// ── Workout v2 ──────────────────────────────────────────────

export type ExerciseCategory = 'push' | 'pull' | 'legs' | 'core' | 'cardio' | 'full_body'
export type MovementType = 'compound' | 'isolation' | 'cardio'
export type WeightUnit = 'kg' | 'lb'
export type ProgramGoal = 'strength' | 'hypertrophy' | 'fat_loss' | 'endurance' | 'general_fitness'
export type ProgramDifficulty = 'beginner' | 'intermediate' | 'advanced'
export type ProgramStatus = 'draft' | 'active' | 'completed'

export type ExerciseV2 = {
  id: string
  name: string
  muscle_groups: string[]
  category: ExerciseCategory
  equipment: string[]
  movement_type: MovementType
  demo_video_url: string | null
  demo_image_url: string | null
  instructions: string | null
  created_by: string | null
  is_system: boolean
  created_at: string
}

export type Program = {
  id: string
  coach_id: string
  client_id: string | null
  template_id: string | null
  name: string
  description: string | null
  duration_weeks: number
  days_per_week: number
  goal: ProgramGoal
  difficulty: ProgramDifficulty
  status: ProgramStatus
  started_at: string | null
  completed_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type ProgramWorkout = {
  id: string
  program_id: string
  week_number: number
  day_number: number
  name: string
  notes: string | null
  created_at: string
}

export type Superset = {
  id: string
  workout_id: string
  label: string | null
  created_at: string
}

export type ProgramWorkoutExercise = {
  id: string
  workout_id: string
  exercise_id: string
  superset_id: string | null
  order_index: number
  sets: number
  reps_min: number
  reps_max: number
  weight: number | null
  weight_unit: WeightUnit
  rest_seconds: number
  rpe: number | null
  tempo: string | null
  notes: string | null
  created_at: string
  // joined
  exercise?: ExerciseV2
}

export type ProgramTemplate = {
  id: string
  coach_id: string
  name: string
  description: string | null
  duration_weeks: number
  days_per_week: number
  goal: ProgramGoal
  difficulty: ProgramDifficulty
  is_public: boolean
  structure: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type WorkoutLog = {
  id: string
  client_id: string
  program_id: string | null
  workout_id: string | null
  logged_at: string
  duration_minutes: number | null
  notes: string | null
  created_at: string
  // joined
  sets?: WorkoutLogSet[]
}

export type WorkoutLogSet = {
  id: string
  log_id: string
  exercise_id: string
  set_number: number
  reps_completed: number | null
  weight_kg: number | null
  weight_input: number | null
  weight_unit: WeightUnit
  rpe_actual: number | null
  notes: string | null
  is_warmup: boolean
  created_at: string
  // joined
  exercise?: ExerciseV2
}

export type PersonalBest = {
  id: string
  client_id: string
  exercise_id: string
  reps: number
  weight_kg: number
  estimated_1rm_kg: number
  achieved_at: string
  log_set_id: string | null
  created_at: string
  // joined
  exercise?: ExerciseV2
}
