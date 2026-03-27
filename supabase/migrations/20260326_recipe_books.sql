CREATE TABLE IF NOT EXISTS recipe_books (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  diet_type   TEXT NOT NULL DEFAULT 'Balanced',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recipe_books ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_recipe_books" ON recipe_books FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

CREATE TABLE IF NOT EXISTS recipes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id      UUID NOT NULL REFERENCES recipe_books(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  prep_time    INTEGER NOT NULL DEFAULT 0,
  calories     INTEGER NOT NULL DEFAULT 0,
  protein_g    NUMERIC NOT NULL DEFAULT 0,
  carbs_g      NUMERIC NOT NULL DEFAULT 0,
  fats_g       NUMERIC NOT NULL DEFAULT 0,
  ingredients  TEXT[] NOT NULL DEFAULT '{}',
  steps        TEXT[] NOT NULL DEFAULT '{}',
  tags         TEXT[] NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_recipes" ON recipes FOR ALL
  USING (
    EXISTS (SELECT 1 FROM recipe_books rb WHERE rb.id = book_id AND rb.coach_id = auth.uid())
  );
CREATE INDEX IF NOT EXISTS idx_recipes_book_id ON recipes(book_id);
