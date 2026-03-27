CREATE TABLE IF NOT EXISTS coach_public_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_initials TEXT NOT NULL DEFAULT '',
  rating NUMERIC(3,1) NOT NULL DEFAULT 5.0,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_public_profiles_slug ON coach_public_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_coach_public_profiles_coach_id ON coach_public_profiles(coach_id);

ALTER TABLE coach_public_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read published profiles
CREATE POLICY "Public profiles are readable by anyone"
  ON coach_public_profiles FOR SELECT
  USING (published = true);

-- Coaches can manage their own profile
CREATE POLICY "Coaches can manage their own public profile"
  ON coach_public_profiles FOR ALL
  USING (coach_id = auth.uid());
