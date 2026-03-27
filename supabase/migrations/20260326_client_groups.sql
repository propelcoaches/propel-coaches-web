CREATE TABLE IF NOT EXISTS client_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS client_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES client_groups(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, client_id)
);

ALTER TABLE client_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coach_manage_groups" ON client_groups FOR ALL USING (auth.uid() = coach_id);
CREATE POLICY "coach_manage_group_members" ON client_group_members FOR ALL USING (
  EXISTS (SELECT 1 FROM client_groups g WHERE g.id = client_group_members.group_id AND g.coach_id = auth.uid())
);
