-- AI Coach Tier — Phase 1 Foundation
-- Adds coaching_type to profiles + three new tables for the AI coaching product

-- ── coaching_type on profiles ─────────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coaching_type text DEFAULT 'human';

-- ── Consumer agreement tracking ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_coach_agreements (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreement_version text NOT NULL DEFAULT '1.0',
  accepted_at      timestamptz NOT NULL DEFAULT now(),
  ip_address       text,
  user_agent       text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(user_id, agreement_version)
);

-- ── Onboarding questionnaire responses ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_onboarding_responses (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  fitness_goal             text NOT NULL,       -- 'lose_weight' | 'build_muscle' | 'improve_fitness' | 'sport_performance' | 'general_health'
  experience_level         text NOT NULL,       -- 'beginner' | 'intermediate' | 'advanced'
  training_days_per_week   integer NOT NULL,    -- 1-7
  session_duration_minutes integer NOT NULL,    -- 30, 45, 60, 75, 90
  available_equipment      text NOT NULL,       -- 'full_gym' | 'home_basic' | 'home_full' | 'bodyweight' | 'resistance_bands'
  injuries_limitations     text,               -- free text, nullable
  sport_preference         text,               -- maps to SportCategory if applicable
  dietary_preference       text,               -- 'no_preference' | 'high_protein' | 'balanced' | 'vegetarian' | 'vegan' | 'keto' | 'paleo'
  dietary_restrictions     text,               -- free text (allergies, intolerances)
  current_weight_kg        numeric,
  target_weight_kg         numeric,
  height_cm                numeric,
  age                      integer,
  sex                      text,               -- 'male' | 'female' | 'other' | 'prefer_not_to_say'
  completed_at             timestamptz,
  created_at               timestamptz DEFAULT now(),
  updated_at               timestamptz DEFAULT now()
);

-- ── AI agent action log (debugging + analytics) ───────────────────────────────
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trigger_type   text NOT NULL,   -- 'onboarding' | 'message' | 'check_in' | 'nudge' | 'program_complete'
  input_summary  text,            -- brief description of input context
  output_action  text,            -- what the AI did
  model_used     text,            -- 'gpt-4o' | 'claude-sonnet' etc.
  tokens_used    integer,
  latency_ms     integer,
  error          text,
  created_at     timestamptz DEFAULT now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE ai_coach_agreements     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_logs           ENABLE ROW LEVEL SECURITY;

-- Users can read/insert/update/delete their own agreement record
CREATE POLICY "Users manage own agreements" ON ai_coach_agreements
  FOR ALL USING (user_id = auth.uid());

-- Users can manage their own onboarding responses
CREATE POLICY "Users manage own onboarding" ON ai_onboarding_responses
  FOR ALL USING (user_id = auth.uid());

-- Users can read their own agent logs (service role inserts, bypasses RLS)
CREATE POLICY "Users read own agent logs" ON ai_agent_logs
  FOR SELECT USING (user_id = auth.uid());

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ai_onboarding_user  ON ai_onboarding_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_logs_user  ON ai_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_coaching_type ON profiles(coaching_type);
