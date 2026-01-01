-- Migration: Security Hardening & Role Management
-- This migration creates a profiles table for role-based access control (RBAC)
-- and fixes critical PII leaks in RLS policies.

-- 1. Create Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  role text default 'user' check (role in ('user', 'vendor', 'admin')),
  created_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 2. Trigger to sync auth.users to profiles
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'role', 'user')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Re-create trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Sync existing users to profiles if any are missing
insert into public.profiles (id, email, role)
select id, email, coalesce(raw_user_meta_data->>'role', 'user')
from auth.users
on conflict (id) do nothing;

-- 3. HARDEN RLS POLICIES

-- A. Places (Admin Protection)
drop policy if exists "Admins can delete places" on places;
create policy "Admins can delete places"
  on places for delete
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update places" on places;
create policy "Admins can update places"
  on places for update
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- B. Claim Requests (PII Protection)
drop policy if exists "Admins can view all claims" on claim_requests;
create policy "Admins can view all claims"
  on claim_requests for select
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update claims" on claim_requests;
create policy "Admins can update claims"
  on claim_requests for update
  using (
    exists (
      select 1 from profiles 
      where id = auth.uid() and role = 'admin'
    )
  );

-- C. Tickets (Anonymous Scrape Protection)
drop policy if exists "Anon View Tickets" on tickets;
-- Only allow viewing someone else's ticket if you are the logged in owner of the place (vendor)
-- or the user themselves. Anon view is disabled for now for privacy.
