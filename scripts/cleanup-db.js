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

async function cleanup() {
    console.log("🔥 Starting Database Purge...");

    // 1. Delete all tickets
    console.log("Cleaning up tickets...");
    const { error: ticketError } = await supabase
        .from('tickets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (ticketError) console.error("Error cleaning tickets:", ticketError);
    else console.log("✅ All tickets cleared.");

    // 2. Delete all places (since we want a clean start for curated data)
    console.log("Cleaning up places...");
    const { error: placeError } = await supabase
        .from('places')
        .delete()
        .is('owner_id', null); // Removes all seeded/scraped places

    if (placeError) console.error("Error cleaning places:", placeError);
    else console.log("✅ All demo/scraped places cleared.");

    console.log("\n✨ Database is now clean. Ready for fresh population.");
}

cleanup();
