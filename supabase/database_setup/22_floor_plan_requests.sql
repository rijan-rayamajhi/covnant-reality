-- ==========================================
-- 22_FLOOR_PLAN_REQUESTS.SQL
-- Floor Plan Access Request System
-- ==========================================

-- 1. Create the floor_plan_requests table
CREATE TABLE IF NOT EXISTS floor_plan_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, requester_id)
);

-- 2. Enable RLS
ALTER TABLE floor_plan_requests ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies

-- Requesters can insert their own requests
CREATE POLICY "Users can request floor plan access"
  ON floor_plan_requests FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Requesters can view their own requests
CREATE POLICY "Users can view own requests"
  ON floor_plan_requests FOR SELECT
  USING (auth.uid() = requester_id);

-- Property owners can view requests for their own properties
CREATE POLICY "Owners can view requests for own properties"
  ON floor_plan_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = floor_plan_requests.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Property owners can update (approve/reject) requests for their own properties
CREATE POLICY "Owners can update requests for own properties"
  ON floor_plan_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = floor_plan_requests.property_id
        AND properties.owner_id = auth.uid()
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all floor plan requests"
  ON floor_plan_requests FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- Also allow admins by profile role (belt-and-suspenders for DB-promoted admins)
CREATE POLICY "Admins by profile can manage all floor plan requests"
  ON floor_plan_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_floor_plan_requests_property
  ON floor_plan_requests(property_id);

CREATE INDEX IF NOT EXISTS idx_floor_plan_requests_requester
  ON floor_plan_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_floor_plan_requests_status
  ON floor_plan_requests(status);
