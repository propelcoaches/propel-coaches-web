-- Add profession and client feature flags to coach profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS client_features JSONB DEFAULT '{
  "training": true,
  "nutrition": true,
  "check_ins": true,
  "habits": true,
  "tasks": true,
  "resources": true,
  "messaging": true,
  "progress": true
}'::jsonb;
