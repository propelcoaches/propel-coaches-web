CREATE TABLE IF NOT EXISTS coach_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL DEFAULT '',
  logo_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  accent_color TEXT NOT NULL DEFAULT '#0F7B8C',
  accent_color_dark TEXT,
  secondary_color TEXT NOT NULL DEFAULT '#1A95A8',
  custom_domain TEXT,
  domain_verified BOOLEAN NOT NULL DEFAULT false,
  email_from_name TEXT,
  email_footer_text TEXT,
  welcome_message TEXT,
  onboarding_video_url TEXT,
  show_meal_plans BOOLEAN NOT NULL DEFAULT true,
  show_habit_tracker BOOLEAN NOT NULL DEFAULT true,
  show_water_tracker BOOLEAN NOT NULL DEFAULT true,
  show_body_measurements BOOLEAN NOT NULL DEFAULT true,
  show_progress_photos BOOLEAN NOT NULL DEFAULT true,
  show_leaderboard BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coach_id)
);

ALTER TABLE coach_branding ENABLE ROW LEVEL SECURITY;

-- Coaches can read and manage their own branding
CREATE POLICY "coaches_manage_own_branding"
  ON coach_branding
  FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Clients can read their coach's branding (needed for client-side injection)
CREATE POLICY "clients_read_coach_branding"
  ON coach_branding
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.coach_id = coach_branding.coach_id
    )
  );
