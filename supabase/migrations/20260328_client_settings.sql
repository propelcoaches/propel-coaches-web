-- Per-client settings: onboarding customisation and app-section visibility
CREATE TABLE IF NOT EXISTS client_settings (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- Onboarding
  welcome_message       TEXT,
  onboarding_video_url  TEXT,
  -- App section visibility (mirrors coach_branding defaults but overrideable per client)
  show_meal_plans        BOOLEAN NOT NULL DEFAULT true,
  show_habit_tracker     BOOLEAN NOT NULL DEFAULT true,
  show_water_tracker     BOOLEAN NOT NULL DEFAULT true,
  show_body_measurements BOOLEAN NOT NULL DEFAULT true,
  show_progress_photos   BOOLEAN NOT NULL DEFAULT true,
  show_leaderboard       BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id)
);

ALTER TABLE client_settings ENABLE ROW LEVEL SECURITY;

-- Coach can read/write settings for their own clients
CREATE POLICY "coaches_manage_client_settings"
  ON client_settings FOR ALL
  USING  (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Client can read their own settings (used in the mobile app)
CREATE POLICY "clients_read_own_settings"
  ON client_settings FOR SELECT
  USING (client_id = auth.uid());
