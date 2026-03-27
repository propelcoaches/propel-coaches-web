CREATE TABLE IF NOT EXISTS notification_broadcasts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  audience        TEXT NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'active', 'at_risk')),
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE notification_broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_view_own_broadcasts" ON notification_broadcasts
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
