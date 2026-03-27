CREATE TABLE IF NOT EXISTS autoflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('day', 'event', 'manual')),
  trigger_day INTEGER,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE autoflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_own_autoflows"
  ON autoflows FOR ALL
  USING (coach_id = auth.uid())
  WITH CHECK (coach_id = auth.uid());
