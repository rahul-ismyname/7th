-- ====================================================
-- Waitly Complete Database Schema
-- Run this in the Supabase SQL Editor to reset/update 
-- your database to the latest state.
-- ====================================================

-- 1. CLEANUP (Optional - Uncomment to wipe data)
-- drop table if exists tickets;
-- drop table if exists places;

-- 2. CREATE TABLES
-- Places Table
create table if not exists places (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text not null,
  address text not null,
  rating float default 0,
  is_approved boolean default false,
  lat float not null,
  lng float not null,
  
  -- Dynamic fields
  live_wait_time int default 0,
  crowd_level text default 'Medium',
  queue_length int default 0,
  current_serving_token text,
  estimated_turn_time text,
  estimated_turn_time text,
  last_updated timestamptz default now(),
  created_at timestamptz default now(), -- Added for sorting
  owner_id uuid references auth.users(id), -- Added for Vendor features
  
  -- Working Hours
  opening_time text, -- Format: "HH:mm" (24h)
  closing_time text  -- Format: "HH:mm" (24h)
);

-- Tickets Table
create table if not exists tickets (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references places(id),
  user_id uuid references auth.users(id), -- Linked to authenticated user
  token_number text not null,
  status text default 'waiting', -- waiting, serving, completed, cancelled
  estimated_wait int,
  created_at timestamptz default now(),
  -- Feedback fields
  has_feedback_provided boolean default false,
  user_reported_wait_time int default 0,
  
  -- Form Data
  counter text,
  preferred_time text,
  preferred_date text,
  
  -- Review Data
  counter_used text,
  actual_wait_time int
);

-- Idempotent updates for existing tables
alter table tickets add column if not exists counter text;
alter table tickets add column if not exists preferred_time text;
alter table tickets add column if not exists preferred_date text;
alter table tickets add column if not exists counter_used text;
alter table tickets add column if not exists actual_wait_time int;

-- Idempotent updates for places
alter table places add column if not exists opening_time text;
alter table places add column if not exists closing_time text;

-- 3. ENABLE REALTIME (Idempotent)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'places') then
    alter publication supabase_realtime add table places;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'tickets') then
    alter publication supabase_realtime add table tickets;
  end if;
end;
$$;

-- 4. ENABLE ROW LEVEL SECURITY (RLS)
alter table places enable row level security;
alter table tickets enable row level security;

-- 5. POLICIES (Supabase Security)

-- A. PLACES POLICIES
-- Drop existing policies to avoid conflicts when re-running
drop policy if exists "Public Places Access" on places;
drop policy if exists "Authenticated Insert" on places;
drop policy if exists "Owners can update their places" on places;
drop policy if exists "Owners can delete their places" on places;

-- Policy 1: Everyone can read places (Required for Admin Realtime & Public Map)
create policy "Public Places Access" on places
  for select
  using (true);

-- Policy 2: Authenticated users can create NEW places (Register Business)
create policy "Authenticated Insert" on places
  for insert
  with check (auth.role() = 'authenticated');

-- Policy 3: Owners can UPDATE their own places
create policy "Owners can update their places"
  on places for update
  using (auth.uid() = owner_id);

-- Policy 4: Owners can DELETE their own places
create policy "Owners can delete their places"
  on places for delete
  using (auth.uid() = owner_id);

-- Policy 5: Super Admins (Any Auth User) can DELETE places
create policy "Admins can delete places"
  on places for delete
  using (auth.role() = 'authenticated');

-- Policy 6: Super Admins (Any Auth User) can UPDATE places (Approve/Reject)
create policy "Admins can update places"
  on places for update
  using (auth.role() = 'authenticated');


-- B. TICKETS POLICIES
drop policy if exists "User View Own Tickets" on tickets;
drop policy if exists "User Create Own Tickets" on tickets;
drop policy if exists "User Update Own Tickets" on tickets;
drop policy if exists "User Delete Own Tickets" on tickets;

-- Policy 1: Users can see their own tickets
create policy "User View Own Tickets" on tickets
  for select using (auth.uid() = user_id);

-- Policy 2: Users can create tickets for themselves
create policy "User Create Own Tickets" on tickets
  for insert with check (auth.uid() = user_id);

-- Policy 3: Users can update their own tickets (e.g., cancel)
create policy "User Update Own Tickets" on tickets
  for update using (auth.uid() = user_id);

-- Policy 4: Users can delete their own tickets (e.g., clear history)
create policy "User Delete Own Tickets" on tickets
  for delete using (auth.uid() = user_id);
  
-- Policy 5: Allow public access for anonymous tickets (Optional fallback)
drop policy if exists "Anon View Tickets" on tickets;
drop policy if exists "Anon Create Tickets" on tickets;
create policy "Anon View Tickets" on tickets for select using (user_id is null);
create policy "Anon Create Tickets" on tickets for insert with check (user_id is null);


-- 7. STORAGE POLICIES (Avatars)
-- Create a new storage bucket for avatars
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Allow public access to avatars
drop policy if exists "Avatar Public Access" on storage.objects;
create policy "Avatar Public Access"
on storage.objects for select
using ( bucket_id = 'avatars' );

-- Allow authenticated users to upload avatars
drop policy if exists "Avatar Upload Access" on storage.objects;
create policy "Avatar Upload Access"
on storage.objects for insert
with check (
  bucket_id = 'avatars' 
  and auth.role() = 'authenticated'
);

-- Allow users to update their own avatars
drop policy if exists "Avatar Update Access" on storage.objects;
create policy "Avatar Update Access"
on storage.objects for update
using (
  bucket_id = 'avatars' 
  and auth.uid() = owner
);

-- Allow users to delete their own avatars
drop policy if exists "Avatar Delete Access" on storage.objects;
create policy "Avatar Delete Access"
on storage.objects for delete
using (
  bucket_id = 'avatars' 
  and auth.uid() = owner
);


-- 8. PERFORMANCE INDEXES
-- Places Indexes
create index if not exists places_owner_id_idx on places(owner_id);
create index if not exists places_is_approved_idx on places(is_approved);

-- Tickets Indexes
create index if not exists tickets_user_id_idx on tickets(user_id);
create index if not exists tickets_place_id_idx on tickets(place_id);
create index if not exists tickets_status_idx on tickets(status);
create index if not exists tickets_created_at_idx on tickets(created_at desc);


-- 6. DUMMY DATA SEEDING (Optional)
insert into places (name, type, address, rating, is_approved, lat, lng, live_wait_time, crowd_level, queue_length, current_serving_token, estimated_turn_time)
values
  ('SBI Bank', 'Bank', 'Connaught Place, Delhi', 4.2, true, 28.6328, 77.2197, 25, 'High', 12, 'A-102', '10:45 AM'),
  ('Apollo Clinic', 'Clinic', 'Sector 18, Noida', 4.5, false, 28.5708, 77.3270, 45, 'Medium', 0, null, null),
  ('Central Library', 'Public Service', 'Shivaji Bridge', 4.8, false, 28.6340, 77.2220, 10, 'Low', 0, null, null),
  ('KFC', 'Restaurant', 'Outer Circle, CP', 4.0, true, 28.6304, 77.2200, 15, 'Medium', 5, 'K-55', '10:20 AM'),
  ('RTO Office', 'Government', 'Janpath', 3.1, false, 28.6280, 77.2180, 120, 'High', 0, null, null)
on conflict do nothing; -- Prevent duplicates if run multiple times
