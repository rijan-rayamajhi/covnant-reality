-- ==========================================
-- 25_DISTRICT_INTEGRATIONS.SQL
-- Creates district integrations and prevents circular dependencies
-- ==========================================

CREATE TABLE IF NOT EXISTS district_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  main_district_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  connected_district_id UUID REFERENCES cities(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(main_district_id, connected_district_id),
  CONSTRAINT prevent_self_connection CHECK (main_district_id != connected_district_id)
);

CREATE OR REPLACE FUNCTION prevent_circular_district_integration()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM district_integrations 
    WHERE main_district_id = NEW.connected_district_id 
    AND connected_district_id = NEW.main_district_id
  ) THEN
    RAISE EXCEPTION 'Circular connection is not allowed.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_circular_district_integration ON district_integrations;

CREATE TRIGGER trg_prevent_circular_district_integration
BEFORE INSERT OR UPDATE ON district_integrations
FOR EACH ROW EXECUTE FUNCTION prevent_circular_district_integration();
