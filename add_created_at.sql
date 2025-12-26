-- Add created_at column to places table
alter table places 
add column if not exists created_at timestamptz default now();

-- Ensure it's populated for existing rows (optional, defaults to now() anyway on creation, but good for existing rows)
update places set created_at = now() where created_at is null;
