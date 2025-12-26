-- 1. Add owner_id to places
ALTER TABLE places ADD COLUMN IF NOT EXISTS owner_id uuid references auth.users(id);

-- 2. Update RLS for Places
-- Drop the wide-open policy
DROP POLICY IF EXISTS "Public Places Access" ON places;

-- Allow everyone to read places
CREATE POLICY "Public Read Places" ON places
  FOR SELECT USING (true);

-- Allow authenticated users to create places (and become owner)
CREATE POLICY "Auth Create Places" ON places
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow owners to update their places
CREATE POLICY "Owner Update Places" ON places
  FOR UPDATE USING (auth.uid() = owner_id);

-- Allow owners to delete their places
CREATE POLICY "Owner Delete Places" ON places
  FOR DELETE USING (auth.uid() = owner_id);

-- 3. Update RLS for Tickets (Vendors need to see/manage tickets for their places)
-- Allow Vendors (owners of the place) to select tickets
CREATE POLICY "Vendor View Tickets" ON tickets
  FOR SELECT USING (
    exists (
      select 1 from places
      where places.id = tickets.place_id
      and places.owner_id = auth.uid()
    )
  );

-- Allow Vendors to update tickets (call next, complete, etc)
CREATE POLICY "Vendor Update Tickets" ON tickets
  FOR UPDATE USING (
    exists (
      select 1 from places
      where places.id = tickets.place_id
      and places.owner_id = auth.uid()
    )
  );
