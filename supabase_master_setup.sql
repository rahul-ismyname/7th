-- ==========================================
-- MASTER SETUP SCRIPT FOR WAITLY
-- RUN THIS IN SUPABASE SQL EDITOR
-- CAUTION: THIS WILL RESET YOUR DATABASE DATA
-- ==========================================

-- 1. RESET (Drop existing tables)
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS places;

-- 2. CREATE PLACES TABLE
CREATE TABLE places (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid REFERENCES auth.users(id), -- Linked to Business Owner
  name text NOT NULL,
  type text NOT NULL,
  address text NOT NULL,
  rating float DEFAULT 0,
  is_approved boolean DEFAULT false,
  lat float NOT NULL,
  lng float NOT NULL,
  
  -- Dynamic Operation Fields
  live_wait_time int DEFAULT 0,
  crowd_level text DEFAULT 'Medium',
  queue_length int DEFAULT 0,
  current_serving_token text,
  estimated_turn_time text,
  last_updated timestamptz DEFAULT now()
);

-- 3. CREATE TICKETS TABLE
CREATE TABLE tickets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id uuid REFERENCES places(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id), -- Linked to Customer
  token_number text NOT NULL,
  status text DEFAULT 'waiting', -- waiting, serving, completed, cancelled
  estimated_wait int,
  created_at timestamptz DEFAULT now()
);

-- 4. ENABLE REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE places;
ALTER PUBLICATION supabase_realtime ADD TABLE tickets;

-- 5. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLICIES (SECURITY RULES)
-- ==========================================

-- PLACES POLICIES --
-- 1. Public Read: Everyone can see places
CREATE POLICY "Public Read Places" ON places
  FOR SELECT USING (true);

-- 2. Auth Create: Authenticated users can create places (and become owners)
CREATE POLICY "Auth Create Places" ON places
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- 3. Owner Update: Only the owner can update their place
CREATE POLICY "Owner Update Places" ON places
  FOR UPDATE USING (auth.uid() = owner_id);

-- 4. Owner Delete: Only the owner can delete their place
CREATE POLICY "Owner Delete Places" ON places
  FOR DELETE USING (auth.uid() = owner_id);


-- TICKETS POLICIES --
-- 1. User View Own: Users see their own tickets
CREATE POLICY "User View Own Tickets" ON tickets
  FOR SELECT USING (auth.uid() = user_id);

-- 2. User Create: Users can join queues (create tickets)
CREATE POLICY "User Create Own Tickets" ON tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. User Leave: Users can cancel their own tickets
CREATE POLICY "User Update Own Tickets" ON tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- 4. Vendor View: Vendors see ALL tickets for THEIR places
CREATE POLICY "Vendor View Place Tickets" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = tickets.place_id
      AND places.owner_id = auth.uid()
    )
  );

-- 5. Vendor Manage: Vendors can update ticket status (Serve/Complete)
CREATE POLICY "Vendor Manage Place Tickets" ON tickets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM places
      WHERE places.id = tickets.place_id
      AND places.owner_id = auth.uid()
    )
  );

-- ==========================================
-- SEED DATA (OPTIONAL)
-- ==========================================
-- Note: These dummy places have NO OWNER (owner_id is null). 
-- You won't be able to manage them in Vendor Dashboard, but they will show up in the App.

INSERT INTO places (name, type, address, rating, is_approved, lat, lng, live_wait_time, crowd_level, queue_length, current_serving_token, estimated_turn_time)
VALUES
  ('SBI Bank (Demo)', 'Bank', 'Connaught Place, Delhi', 4.2, true, 28.6328, 77.2197, 25, 'High', 12, 'A-102', '10:45 AM'),
  ('KFC (Demo)', 'Restaurant', 'Outer Circle, CP', 4.0, true, 28.6304, 77.2200, 15, 'Medium', 5, 'K-55', '10:20 AM'),
  ('RTO Office (Demo)', 'Government', 'Janpath', 3.1, false, 28.6280, 77.2180, 120, 'High', 0, null, null);

