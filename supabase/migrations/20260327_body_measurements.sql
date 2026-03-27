CREATE TABLE IF NOT EXISTS body_measurements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  chest       NUMERIC(5,1),
  waist       NUMERIC(5,1),
  hips        NUMERIC(5,1),
  arms        NUMERIC(5,1),
  thighs      NUMERIC(5,1),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, date)
);

ALTER TABLE body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_measurements" ON body_measurements
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

CREATE POLICY "clients_view_own_measurements" ON body_measurements
  FOR SELECT USING (client_id = auth.uid());
