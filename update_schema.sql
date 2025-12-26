-- Add owner_id to places table to support Vendor features
alter table places 
add column if not exists owner_id uuid references auth.users(id);

-- Update Policies to allow owners to manage their own places
create policy "Owners can update their places"
  on places for update
  using (auth.uid() = owner_id);

create policy "Owners can delete their places"
  on places for delete
  using (auth.uid() = owner_id);

-- Also ensure public read access is explicit (already exists usually, but good to confirm)
-- drop policy if exists "Public Places Access" on places;
-- create policy "Public Places Access" on places for select using (true);
