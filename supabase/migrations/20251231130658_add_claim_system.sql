-- Migration: Add Claim System
-- Created: 2025-12-31

-- 1. Create Claim Requests Table
create table if not exists claim_requests (
  id uuid default gen_random_uuid() primary key,
  place_id uuid references places(id) not null,
  user_id uuid references auth.users(id) not null,
  full_name text not null,
  business_email text not null,
  phone text not null,
  verification_info text not null,
  status text default 'pending',
  created_at timestamptz default now()
);

-- 2. Enable Security
alter table claim_requests enable row level security;

-- 3. Add Policies
drop policy if exists "Users can create claims" on claim_requests;
create policy "Users can create claims" on claim_requests for insert with check (auth.uid() = user_id);

drop policy if exists "Users can view own claims" on claim_requests;
create policy "Users can view own claims" on claim_requests for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all claims" on claim_requests;
create policy "Admins can view all claims" on claim_requests for select using (true);

drop policy if exists "Admins can update claims" on claim_requests;
create policy "Admins can update claims" on claim_requests for update using (true);

-- 4. Update the search function to include owner_id (Crucial for UI)
drop function if exists get_nearby_places;

create or replace function get_nearby_places(
  cur_lat double precision,
  cur_lng double precision,
  radius_km double precision default 5.0,
  search_term text default null
) returns table (
  id uuid,
  name text,
  type text,
  address text,
  rating float,
  is_approved boolean,
  lat double precision,
  lng double precision,
  live_wait_time int,
  crowd_level text,
  queue_length int,
  current_serving_token text,
  estimated_turn_time text,
  last_updated timestamptz,
  average_service_time int,
  owner_id uuid, -- < Added this
  dist_meters double precision,
  relevance_score int
) language plpgsql security definer as $$
begin
  return query
  select
    p.id, p.name, p.type, p.address, p.rating, p.is_approved, p.lat, p.lng,
    p.live_wait_time, p.crowd_level, p.queue_length,
    p.current_serving_token, p.estimated_turn_time, p.last_updated,
    p.average_service_time, p.owner_id, -- < And this
    st_distance(
      st_point(cur_lng, cur_lat)::geography,
      st_point(p.lng, p.lat)::geography
    ) as dist_meters,
    case
      when search_term is null then 0
      when lower(p.name) like lower(search_term || '%') then 100
      when lower(p.name) like lower('%' || search_term || '%') then 50
      when lower(p.type) like lower('%' || search_term || '%') then 30
      when lower(p.address) like lower('%' || search_term || '%') then 10
      else 0
    end as relevance_score
  from places p
  where p.is_approved = true
  and (
    -- If searching, allow finding places further away if relevance is high
    (search_term is not null and (
      lower(p.name) like lower('%' || search_term || '%') or 
      lower(p.type) like lower('%' || search_term || '%') or 
      lower(p.address) like lower('%' || search_term || '%')
    ) and st_dwithin(st_point(cur_lng, cur_lat)::geography, st_point(p.lng, p.lat)::geography, 2000000)) -- 2000km max for search
    or
    -- Default nearby search
    (search_term is null and st_dwithin(st_point(cur_lng, cur_lat)::geography, st_point(p.lng, p.lat)::geography, radius_km * 1000))
  )
  order by 
    case when search_term is not null then relevance_score end desc,
    dist_meters asc;
end;
$$;
