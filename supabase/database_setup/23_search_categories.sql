-- ==========================================
-- 23_SEARCH_CATEGORIES.SQL
-- Dynamic Search Categories & Subtypes
-- ==========================================

-- Main categories (e.g., Residential, Commercial)
CREATE TABLE IF NOT EXISTS search_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subtypes for each category
CREATE TABLE IF NOT EXISTS search_subtypes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES search_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE search_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_subtypes ENABLE ROW LEVEL SECURITY;

-- Public can read
DROP POLICY IF EXISTS "Public can read search categories" ON search_categories;
CREATE POLICY "Public can read search categories" ON search_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can read search subtypes" ON search_subtypes;
CREATE POLICY "Public can read search subtypes" ON search_subtypes
  FOR SELECT USING (true);

-- Only admins can modify
DROP POLICY IF EXISTS "Admins can manage search categories" ON search_categories;
CREATE POLICY "Admins can manage search categories" ON search_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can manage search subtypes" ON search_subtypes;
CREATE POLICY "Admins can manage search subtypes" ON search_subtypes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Seed Initial Data
INSERT INTO search_categories (name, slug, display_order)
VALUES
  ('Residential', 'residential', 1),
  ('Commercial', 'commercial', 2)
ON CONFLICT (slug) DO NOTHING;

-- Subtypes for Residential
INSERT INTO search_subtypes (category_id, name, display_order)
SELECT c.id, t.name, t.ord
FROM search_categories c
CROSS JOIN (VALUES
  ('Flat/Apartment', 1),
  ('Builder Floor', 2),
  ('Independent House/Villa', 3),
  ('Residential Land', 4),
  ('1 RK/ Studio Apartment', 5),
  ('Farm House', 6),
  ('Serviced Apartments', 7),
  ('Other', 8)
) AS t(name, ord)
WHERE c.slug = 'residential'
ON CONFLICT DO NOTHING;

-- Subtypes for Commercial
INSERT INTO search_subtypes (category_id, name, display_order)
SELECT c.id, t.name, t.ord
FROM search_categories c
CROSS JOIN (VALUES
  ('Ready to Move Offices', 1),
  ('Bare Shell Offices', 2),
  ('Shops & Retail', 3),
  ('Commercial/Inst. Land', 4),
  ('Agricultural/Farm Land', 5),
  ('Industrial Land/Plots', 6),
  ('Warehouse', 7),
  ('Cold Storage', 8),
  ('Factory & Manufacturing', 9),
  ('Hotel/Resorts', 10)
) AS t(name, ord)
WHERE c.slug = 'commercial'
ON CONFLICT DO NOTHING;
