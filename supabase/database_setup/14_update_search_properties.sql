-- Update search_properties to accept p_agent_id

CREATE OR REPLACE FUNCTION search_properties(
  p_city text DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_bedrooms int DEFAULT NULL,
  p_listing_type text DEFAULT NULL,
  p_is_verified boolean DEFAULT NULL,
  p_property_type text DEFAULT NULL,
  p_min_area numeric DEFAULT NULL,
  p_max_area numeric DEFAULT NULL,
  p_furnishing text DEFAULT NULL,
  p_query text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0,
  p_agent_id uuid DEFAULT NULL,
  p_include_connected boolean DEFAULT true
)
RETURNS TABLE (
  id uuid,
  owner_id uuid,
  title text,
  description text,
  listing_type property_listing_type,
  property_type property_type_category,
  commercial_type text,
  price numeric,
  area_sqft numeric,
  area_unit text,
  bedrooms int,
  bathrooms int,
  furnishing furnishing_status,
  address text,
  city text,
  status property_status,
  is_verified boolean,
  is_featured boolean,
  created_at timestamptz,
  total_count bigint
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hard cap limit to 50
  IF p_limit IS NULL OR p_limit > 50 THEN
    p_limit := 50;
  END IF;

  RETURN QUERY
  SELECT 
    p.id, p.owner_id, p.title, p.description, p.listing_type, 
    p.property_type, p.commercial_type, p.price, p.area_sqft, p.area_unit, p.bedrooms, p.bathrooms, 
    p.furnishing, p.address, p.city, p.status, p.is_verified,
    p.is_featured,
    p.created_at,
    COUNT(*) OVER() as total_count
  FROM properties p
  WHERE p.status = 'approved'
    AND (
      p_city IS NULL 
      OR p.city ILIKE '%' || p_city || '%'
      OR (
        p_include_connected = true AND p.city_id IN (
          SELECT connected_district_id 
          FROM district_integrations di 
          JOIN cities c ON c.id = di.main_district_id 
          WHERE c.name ILIKE '%' || p_city || '%'
        )
      )
    )
    AND (p_min_price IS NULL OR p.price >= p_min_price)
    AND (p_max_price IS NULL OR p.price <= p_max_price)
    AND (p_bedrooms IS NULL OR p.bedrooms = p_bedrooms)
    AND (p_listing_type IS NULL OR p.listing_type::text = p_listing_type)
    AND (p_is_verified IS NULL OR p.is_verified = p_is_verified)
    AND (p_property_type IS NULL 
         OR (p_property_type = 'residential' AND p.property_type::text IN ('apartment', 'villa', 'house', 'plot'))
         OR p.property_type::text = p_property_type)
    AND (p_min_area IS NULL OR p.area_sqft >= p_min_area)
    AND (p_max_area IS NULL OR p.area_sqft <= p_max_area)
    AND (p_furnishing IS NULL OR p.furnishing::text = p_furnishing)
    AND (p_agent_id IS NULL OR p.owner_id = p_agent_id)
    AND (
      p_query IS NULL
      OR to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.description, ''))
         @@ plainto_tsquery('english', p_query)
    )
  ORDER BY p.is_featured DESC, p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
