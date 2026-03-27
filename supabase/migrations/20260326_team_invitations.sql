CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('admin', 'coach')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, email)
);

ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_owner_manage_invitations" ON team_invitations FOR ALL USING (
  EXISTS (SELECT 1 FROM teams t WHERE t.id = team_invitations.team_id AND t.owner_id = auth.uid())
);
CREATE POLICY "invited_user_read" ON team_invitations FOR SELECT USING (
  email = (SELECT email FROM profiles WHERE id = auth.uid())
);
