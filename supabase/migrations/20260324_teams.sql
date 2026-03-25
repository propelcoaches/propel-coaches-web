CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'team',
  max_coaches INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('owner', 'admin', 'coach')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, coach_id)
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_owner_manage" ON teams FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "team_member_read" ON team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM team_members tm WHERE tm.team_id = team_members.team_id AND tm.coach_id = auth.uid())
);
CREATE POLICY "team_owner_manage_members" ON team_members FOR ALL USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_members.team_id AND t.owner_id = auth.uid())
);
