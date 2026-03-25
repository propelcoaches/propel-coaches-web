-- Forms system: check-in forms and questionnaires created by coaches

CREATE TABLE IF NOT EXISTS check_in_forms (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name          text NOT NULL,
  form_type     text NOT NULL CHECK (form_type IN ('check_in', 'questionnaire')),
  schedule_type text CHECK (schedule_type IN ('daily', 'weekly', 'biweekly', 'monthly', 'not_set')) DEFAULT 'not_set',
  schedule_day  text,
  questions     jsonb NOT NULL DEFAULT '[]',
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE check_in_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_own_forms"
  ON check_in_forms FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_check_in_forms_coach_id ON check_in_forms(coach_id);
CREATE INDEX IF NOT EXISTS idx_check_in_forms_type ON check_in_forms(form_type);

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_in_forms_updated_at
  BEFORE UPDATE ON check_in_forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Form submissions from clients
CREATE TABLE IF NOT EXISTS form_submissions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id       uuid NOT NULL REFERENCES check_in_forms(id) ON DELETE CASCADE,
  client_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coach_id      uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responses     jsonb NOT NULL DEFAULT '{}',
  status        text NOT NULL CHECK (status IN ('pending', 'reviewed')) DEFAULT 'pending',
  coach_notes   text,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  reviewed_at   timestamptz
);

ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_access_own_submissions"
  ON form_submissions FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_form_submissions_coach_id ON form_submissions(coach_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_client_id ON form_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
