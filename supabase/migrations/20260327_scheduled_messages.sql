-- Client subscriptions (tracks active coach-client relationships for broadcast targeting)
CREATE TABLE IF NOT EXISTS client_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (coach_id, client_id)
);

ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_subscriptions" ON client_subscriptions
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- Auto-populate from existing coach-client relationships
INSERT INTO client_subscriptions (coach_id, client_id, status)
SELECT coach_id, id, 'active'
FROM profiles
WHERE role = 'client' AND coach_id IS NOT NULL
ON CONFLICT (coach_id, client_id) DO NOTHING;

-- Scheduled messages queue
CREATE TABLE IF NOT EXISTS scheduled_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  type          TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'announcement', 'reminder')),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_manage_scheduled_messages" ON scheduled_messages
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

CREATE INDEX IF NOT EXISTS scheduled_messages_status_idx ON scheduled_messages (status, scheduled_at);
