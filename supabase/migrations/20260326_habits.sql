-- Habit templates created by coaches
CREATE TABLE IF NOT EXISTS habit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Training',
  target TEXT,
  unit TEXT,
  streak_tracking BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE habit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_own_habit_templates"
  ON habit_templates FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

-- Habits assigned to specific clients
CREATE TABLE IF NOT EXISTS client_habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES habit_templates(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Training',
  target TEXT,
  unit TEXT,
  streak_tracking BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (client_id, title)
);

ALTER TABLE client_habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_client_habits"
  ON client_habits FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "clients_read_own_habits"
  ON client_habits FOR SELECT
  USING (client_id = auth.uid());
