CREATE TABLE IF NOT EXISTS resource_collections (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  color       TEXT NOT NULL DEFAULT 'brand',
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE resource_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_own_collections" ON resource_collections FOR ALL
  USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

CREATE TABLE IF NOT EXISTS resource_collection_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES resource_collections(id) ON DELETE CASCADE,
  resource_id   UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(collection_id, resource_id)
);

ALTER TABLE resource_collection_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches_manage_collection_items" ON resource_collection_items FOR ALL
  USING (
    EXISTS (SELECT 1 FROM resource_collections rc WHERE rc.id = collection_id AND rc.coach_id = auth.uid())
  );
