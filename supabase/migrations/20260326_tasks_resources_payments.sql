-- ─── Tasks ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id   uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title       text NOT NULL,
  description text,
  due_date    date,
  completed   boolean NOT NULL DEFAULT false,
  priority    text NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_tasks" ON tasks FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_tasks_coach_id ON tasks(coach_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ─── Resources ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  resource_type   text NOT NULL CHECK (resource_type IN ('PDF', 'Video', 'Image', 'Link', 'Document')),
  url             text,
  file_path       text,
  file_size_bytes bigint,
  duration_secs   integer,
  tags            text[] NOT NULL DEFAULT '{}',
  assigned_client_ids uuid[] NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_resources" ON resources FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_resources_coach_id ON resources(coach_id);

-- ─── Invoices ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS invoices (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_id       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  invoice_number  text NOT NULL,
  description     text NOT NULL,
  amount_cents    integer NOT NULL,
  currency        text NOT NULL DEFAULT 'AUD',
  status          text NOT NULL CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  due_date        date,
  paid_at         timestamptz,
  stripe_invoice_id text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_invoices" ON invoices FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());
CREATE INDEX IF NOT EXISTS idx_invoices_coach_id ON invoices(coach_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ─── Promo Codes ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS promo_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code        text NOT NULL,
  discount    numeric NOT NULL,
  type        text NOT NULL CHECK (type IN ('percent', 'fixed')),
  duration    text NOT NULL DEFAULT '1_month',
  max_uses    integer,
  uses        integer NOT NULL DEFAULT 0,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(coach_id, code)
);

ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_promo_codes" ON promo_codes FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- ─── Payment settings on profiles ─────────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_currency text DEFAULT 'AUD';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_tax_rate numeric DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_terms_days integer DEFAULT 30;
