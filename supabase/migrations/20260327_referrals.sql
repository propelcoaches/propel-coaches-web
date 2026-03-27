CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referee_email   TEXT NOT NULL,
  referee_name    TEXT,
  referee_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'signed_up', 'converted')),
  reward_amount   INTEGER NOT NULL DEFAULT 2000, -- in cents
  reward_issued   BOOLEAN NOT NULL DEFAULT false,
  signed_up_at    TIMESTAMPTZ,
  converted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (referrer_id, referee_email)
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coaches_view_own_referrals" ON referrals
  FOR ALL USING (referrer_id = auth.uid()) WITH CHECK (referrer_id = auth.uid());
