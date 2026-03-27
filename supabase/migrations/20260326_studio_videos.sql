CREATE TABLE IF NOT EXISTS studio_videos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  url          TEXT NOT NULL,
  duration     TEXT NOT NULL DEFAULT '',
  category     TEXT NOT NULL DEFAULT 'Full Body',
  difficulty   TEXT NOT NULL DEFAULT 'Intermediate' CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE studio_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_studio_videos" ON studio_videos FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_studio_videos_coach_id ON studio_videos(coach_id);
