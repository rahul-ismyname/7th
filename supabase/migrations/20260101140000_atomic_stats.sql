-- Migration: Atomic Statistics Updates
-- This function handles EMA for service time and Moving Average for ratings
-- to prevent race conditions during concurrent user submissions.

create or replace function update_place_stats(
    p_place_id uuid,
    p_reported_wait_time int default null,
    p_new_rating int default null
) returns void as $$
declare
    v_old_avg_time int;
    v_old_rating float;
    v_old_count int;
    v_alpha float := 0.1; -- 10% weight for new service time data
begin
    -- Lock the place row for update to ensure atomicity
    select average_service_time, rating, rating_count
    into v_old_avg_time, v_old_rating, v_old_count
    from places
    where id = p_place_id
    for update;

    -- 1. Update Service Time (EMA)
    if p_reported_wait_time is not null then
        v_old_avg_time := coalesce(v_old_avg_time, 5);
        update places
        set average_service_time = round((v_old_avg_time * (1 - v_alpha)) + (p_reported_wait_time * v_alpha))
        where id = p_place_id;
    end if;

    -- 2. Update Rating (Moving Average)
    if p_new_rating is not null then
        v_old_rating := coalesce(v_old_rating, 0);
        v_old_count := coalesce(v_old_count, 0);
        
        update places
        set 
            rating = round(((v_old_rating * v_old_count) + p_new_rating) / (v_old_count + 1) * 10) / 10,
            rating_count = v_old_count + 1
        where id = p_place_id;
    end if;
end;
$$ language plpgsql security definer;
