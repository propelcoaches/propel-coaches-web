-- Add tags and programme date range to client profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tags       text[]  NOT NULL DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS end_date   date;

-- Same on invitations so data is captured before the client accepts
ALTER TABLE client_invitations ADD COLUMN IF NOT EXISTS tags       text[]  NOT NULL DEFAULT '{}';
ALTER TABLE client_invitations ADD COLUMN IF NOT EXISTS start_date date;
ALTER TABLE client_invitations ADD COLUMN IF NOT EXISTS end_date   date;
