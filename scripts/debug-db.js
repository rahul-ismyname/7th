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

async function checkDatabase() {
    console.log("Checking DB status for Bihar coordinates...");

    // Check Bihar Range (Patna and Muzaffarpur)
    const { data: biharPlaces, error: biharError } = await supabase
        .from('places')
        .select('name, is_approved, lat, lng')
        .gte('lat', 25.0)
        .lte('lat', 27.0)
        .gte('lng', 84.0)
        .lte('lng', 86.0);

    if (biharError) {
        console.error(biharError);
        return;
    }

    if (biharPlaces.length === 0) {
        console.log("No places found in Bihar coordinate range (25-27N, 84-86E)");
    } else {
        console.log(`Found ${biharPlaces.length} places in Bihar!`);
        console.table(biharPlaces);
    }

    // Check Total Approved
    const { data: allApproved, error: allErr } = await supabase
        .from('places')
        .select('name, lat, lng')
        .eq('is_approved', true);

    console.log(`Total Approved: ${allApproved?.length || 0}`);
}

checkDatabase();
