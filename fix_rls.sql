-- Force RLS Policy for Places to allow detailed access for Realtime
begin;

-- Ensure RLS is enabled
alter table places enable row level security;

-- Drop potentially conflicting policies (just to be safe)
drop policy if exists "Public Places Access" on places;

-- Create a broad policy that allows SELECT for everyone (authenticated and anonymous)
-- This is necessary for Realtime to send 'INSERT' payloads to the Admin Dashboard
create policy "Public Places Access" on places
  for select
  using (true);

-- Also ensure INSERT works for authenticated users (which was implied before but good to be explicit)
-- Assuming "Owners can update their places" handles updates.
-- Need to ensure anyone can INSERT (register) a business.
drop policy if exists "Authenticated Insert" on places;
create policy "Authenticated Insert" on places
  for insert
  with check (auth.role() = 'authenticated');
  
commit;
