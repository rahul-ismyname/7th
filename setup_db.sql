-- Reset Tables (CAUTION: Deletes all data)
drop table if exists tickets;
drop table if exists places;

-- Create the 'places' table
create table places (
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
  last_updated timestamptz default now(),
  owner_id uuid references auth.users(id) -- Added for Vendor features
);

-- Create the 'tickets' table
create table tickets (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references places(id),
  user_id uuid references auth.users(id), -- Linked to authenticated user
  token_number text not null,
  status text default 'waiting', -- waiting, serving, completed, cancelled
  estimated_wait int,
  created_at timestamptz default now()
);

-- Enable Realtime for these tables
alter publication supabase_realtime add table places;
alter publication supabase_realtime add table tickets;

-- Enable Row Level Security (RLS)
alter table places enable row level security;
alter table tickets enable row level security;

-- Create Policies
-- Places: Everyone can read and update
create policy "Public Places Access" on places
  for all using (true) with check (true);

-- Tickets:
-- 1. Users can see their own tickets
create policy "User View Own Tickets" on tickets
  for select using (auth.uid() = user_id);

-- 2. Users can create tickets for themselves
create policy "User Create Own Tickets" on tickets
  for insert with check (auth.uid() = user_id);
  
-- 3. (Optional) Allow public access for anonymous tickets if user_id is null
create policy "Anon View Tickets" on tickets
  for select using (user_id is null);

create policy "Anon Create Tickets" on tickets
  for insert with check (user_id is null);

-- Insert some dummy data to start with (The same data from your data.ts)
insert into places (name, type, address, rating, is_approved, lat, lng, live_wait_time, crowd_level, queue_length, current_serving_token, estimated_turn_time)
values
  ('SBI Bank', 'Bank', 'Connaught Place, Delhi', 4.2, true, 28.6328, 77.2197, 25, 'High', 12, 'A-102', '10:45 AM'),
  ('Apollo Clinic', 'Clinic', 'Sector 18, Noida', 4.5, false, 28.5708, 77.3270, 45, 'Medium', 0, null, null),
  ('Central Library', 'Public Service', 'Shivaji Bridge', 4.8, false, 28.6340, 77.2220, 10, 'Low', 0, null, null),
  ('KFC', 'Restaurant', 'Outer Circle, CP', 4.0, true, 28.6304, 77.2200, 15, 'Medium', 5, 'K-55', '10:20 AM'),
  ('RTO Office', 'Government', 'Janpath', 3.1, false, 28.6280, 77.2180, 120, 'High', 0, null, null);
