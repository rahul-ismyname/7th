const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnv() {
    const envPath = path.resolve(__dirname, '../.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        process.exit(1);
    }
    const env = fs.readFileSync(envPath, 'utf8');
    env.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) process.env[key.trim()] = value.trim();
    });
}

loadEnv();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setup() {
    console.log("Setting up claim_requests table...");

    // We use a cheat here: since we can't run raw SQL easily via JS client without an RPC,
    // we'll attempt to create the table by inserting a dummy record or just logging the SQL
    // Actually, usually users run these in Supabase SQL editor. 
    // But since I'm an agent, I'll try to use the 'exec_sql' RPC if it exists, 
    // or I will assume the user will let me know if they want me to just provide the SQL.
    // HOWEVER, I can also just use the REST API to check if it exists.

    console.log("Please run this SQL in your Supabase SQL Editor:");
    console.log(`
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

alter table claim_requests enable row level security;

drop policy if exists "Users can create claims" on claim_requests;
create policy "Users can create claims" on claim_requests for insert with check (auth.uid() = user_id);

drop policy if exists "Users can view own claims" on claim_requests;
create policy "Users can view own claims" on claim_requests for select using (auth.uid() = user_id);

drop policy if exists "Admins can view all claims" on claim_requests;
create policy "Admins can view all claims" on claim_requests for select using (true);

drop policy if exists "Admins can update claims" on claim_requests;
create policy "Admins can update claims" on claim_requests for update using (true);
    `);
}

setup();
