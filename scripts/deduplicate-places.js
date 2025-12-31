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

async function deduplicate() {
    console.log("Starting deduplication...");

    // 1. Find duplicates
    // We group by name, lat, lng and find groups with more than 1 record
    // Since Supabase JS doesn't support complex GROUP BY well, we'll use a raw RPC or just fetch and filter

    const { data: places, error: fetchError } = await supabase
        .from('places')
        .select('id, name, lat, lng, created_at')
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error("Error fetching places:", fetchError);
        return;
    }

    const seen = new Set();
    const toDelete = [];

    places.forEach(p => {
        const key = `${p.name}|${p.lat}|${p.lng}`;
        if (seen.has(key)) {
            toDelete.push(p.id);
        } else {
            seen.add(key);
        }
    });

    if (toDelete.length === 0) {
        console.log("No duplicates found.");
        return;
    }

    console.log(`Found ${toDelete.length} duplicates. Deleting...`);

    // 2. Delete duplicates
    const { error: deleteError } = await supabase
        .from('places')
        .delete()
        .in('id', toDelete);

    if (deleteError) {
        console.error("Error deleting duplicates:", deleteError);
    } else {
        console.log(`Successfully deleted ${toDelete.length} duplicate records!`);
    }
}

deduplicate();
