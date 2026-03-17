-- ==========================================
-- 21_ADMIN_AUTOVERIFY.SQL
-- Ensure properties added by admin are autoverified
-- ==========================================

CREATE OR REPLACE FUNCTION submit_property(p_property jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_owner_id uuid := auth.uid();
  v_role text := auth.jwt() -> 'user_metadata' ->> 'role';
  v_status property_status;
  v_is_verified boolean;
BEGIN
  IF v_owner_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF v_role = 'agent' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Agents are not allowed to submit property listings');
  END IF;

  -- Set status and verification based on role
  IF v_role = 'admin' THEN
    v_status := 'approved';
    v_is_verified := true;
  ELSE
    v_status := 'pending';
    v_is_verified := false;
  END IF;

  INSERT INTO properties (
    owner_id,
    title, description, listing_type, property_type, commercial_type,
    price, area_sqft, area_value, area_unit,
    bedrooms, bathrooms, furnishing, facing, floor, total_floors,
    possession_status, address, locality, locality_id,
    city, city_id, state, state_id, pincode, landmark, rera_number,
    contact_number, whatsapp_number, allow_phone, allow_whatsapp, allow_chat,
    amenities,
    status, is_verified, is_featured
  )
  VALUES (
    v_owner_id,
    p_property->>'title',
    p_property->>'description',
    (p_property->>'listing_type')::property_listing_type,
    (p_property->>'property_type')::property_type_category,
    p_property->>'commercial_type',
    (p_property->>'price')::numeric,
    (p_property->>'area_sqft')::numeric,
    (p_property->>'area_value')::numeric,
    COALESCE(p_property->>'area_unit', 'Sq ft'),
    (p_property->>'bedrooms')::int,
    (p_property->>'bathrooms')::int,
    (p_property->>'furnishing')::furnishing_status,
    p_property->>'facing',
    (p_property->>'floor')::int,
    (p_property->>'total_floors')::int,
    p_property->>'possession_status',
    p_property->>'address',
    p_property->>'locality',
    (p_property->>'locality_id')::uuid,
    p_property->>'city',
    (p_property->>'city_id')::uuid,
    p_property->>'state',
    (p_property->>'state_id')::uuid,
    p_property->>'pincode',
    p_property->>'landmark',
    p_property->>'rera_number',
    p_property->>'contact_number',
    p_property->>'whatsapp_number',
    COALESCE((p_property->>'allow_phone')::boolean, true),
    COALESCE((p_property->>'allow_whatsapp')::boolean, true),
    COALESCE((p_property->>'allow_chat')::boolean, true),
    ARRAY(SELECT jsonb_array_elements_text(p_property->'amenities')),
    v_status,
    v_is_verified,
    false
  )
  RETURNING id INTO v_property_id;

  INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
  VALUES (v_owner_id, 'property_submitted', 'property', v_property_id);

  RETURN jsonb_build_object('success', true, 'property_id', v_property_id);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
