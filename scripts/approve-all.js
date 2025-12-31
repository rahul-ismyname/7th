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

async function approveAll() {
    console.log("Approving all places for visibility...");
    const { error } = await supabase
        .from('places')
        .update({ is_approved: true })
        .eq('is_approved', false);

    if (error) {
        console.error("Error approving places:", error);
    } else {
        console.log("All existing places have been approved and are now visible!");
    }
}

approveAll();
