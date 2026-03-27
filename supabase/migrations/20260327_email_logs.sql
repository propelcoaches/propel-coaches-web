CREATE TABLE IF NOT EXISTS email_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient     TEXT NOT NULL,
  recipient_name TEXT,
  sequence      TEXT,
  email_type    TEXT NOT NULL,
  subject       TEXT NOT NULL,
  success       BOOLEAN NOT NULL DEFAULT true,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No RLS needed — this is an internal platform table (admin/ops only)
-- Only service role can insert; no coach-level access required
