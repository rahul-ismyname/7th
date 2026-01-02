-- Create table for storing Web Push Subscriptions
create table if not exists push_subscriptions (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) not null,
    endpoint text not null unique,
    keys jsonb not null, -- Storing p256dh and auth in a jsonb column or separate? Let's use individual columns for clarity, OR jsonb as 'keys'.
    -- The standard PushSubscription JSON has keys: { p256dh: "...", auth: "..." }
    -- Storing as jsonb is easy.
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- RLS
alter table push_subscriptions enable row level security;

-- Policies
create policy "Users can view own subscriptions"
    on push_subscriptions for select
    using (auth.uid() = user_id);

create policy "Users can insert own subscriptions"
    on push_subscriptions for insert
    with check (auth.uid() = user_id);

create policy "Users can delete own subscriptions"
    on push_subscriptions for delete
    using (auth.uid() = user_id);

-- Indexes
create index if not exists push_subscriptions_user_id_idx on push_subscriptions(user_id);
