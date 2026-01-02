-- Create RPC function to fetch nearby places within a radius
-- This function is used by the frontend to efficiently load places based on viewport/location

-- Drop first to avoid "cannot change return type" error if it already exists with different signature
drop function if exists get_nearby_places(float8, float8, float8, text);

create or replace function get_nearby_places(
    cur_lat float8,
    cur_lng float8,
    radius_km float8,
    search_term text default null
)
returns json
language plpgsql
as $$
declare
    result json;
begin
    select coalesce(json_agg(row_to_json(t)), '[]'::json) into result
    from (
        select 
            p.*,
            -- Calculate distance in meters using PostGIS
            st_distance(
                st_setsrid(st_makepoint(p.lng, p.lat), 4326)::geography,
                st_setsrid(st_makepoint(cur_lng, cur_lat), 4326)::geography
            ) as dist_meters
        from places p
        where 
            -- Distance filter (convert km to meters)
            st_dwithin(
                st_setsrid(st_makepoint(p.lng, p.lat), 4326)::geography,
                st_setsrid(st_makepoint(cur_lng, cur_lat), 4326)::geography,
                radius_km * 1000
            )
            and 
            -- Optional search term filter
            (
                search_term is null 
                or 
                (
                    p.name ilike '%' || search_term || '%' 
                    or 
                    p.type ilike '%' || search_term || '%'
                )
            )
        order by dist_meters asc
        limit 50 -- Safety limit
    ) t;

    return result;
end;
$$;
