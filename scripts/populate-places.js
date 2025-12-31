const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Setup Env
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
    process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS
);

// 2. Define Cities & Categories
const CITIES = {
    "Patna_Full": [25.55, 85.00, 25.68, 85.25],
    "Muzaffarpur_Full": [26.05, 85.30, 26.20, 85.45],
    "Delhi_CP": [28.62, 77.20, 28.64, 77.24],
};

const AMENITIES = [
    "bank", "hospital", "restaurant", "pharmacy", "cafe", "atm", "post_office",
    "doctors", "dentist", "clinic", "school", "college", "university",
    "theatre", "cinema", "mall", "market", "hotel", "police", "park",
    "supermarket", "bakery", "clothes", "electronics", "beauty", "hairdresser",
    "garage", "bicycle", "jewelry", "bookshop", "stationary", "florist",
    "mobile_phone", "boutique", "gift", "variety_store", "department_store",
    "industrial", "it", "telecommunication", "travel_agent"
];

const STATIC_FALLBACK = [
    { name: "SBI Main Branch CP", type: "bank", address: "Parliament Street, New Delhi", lat: 28.6289, lng: 77.2154 },
    { name: "HDFC Bank CP", type: "bank", address: "Kasturba Gandhi Marg, New Delhi", lat: 28.6305, lng: 77.2215 },
    { name: "Ram Manohar Lohia Hospital", type: "hospital", address: "Baba Kharak Singh Marg", lat: 28.6256, lng: 77.2023 },
    { name: "Lady Hardinge Medical College", type: "hospital", address: "Connaught Place", lat: 28.6345, lng: 77.2144 },
    { name: "Saravana Bhavan", type: "restaurant", address: "Janpath St, Connaught Place", lat: 28.6315, lng: 77.2198 },
    { name: "Wenger's Deli", type: "restaurant", address: "A Block, Connaught Place", lat: 28.6334, lng: 77.2192 },
    { name: "Kake Da Virdi", type: "restaurant", address: "Outer Circle, CP", lat: 28.6301, lng: 77.2221 },
    { name: "Standard Chartered Bank", type: "bank", address: "Sansad Marg", lat: 28.6278, lng: 77.2134 },
    { name: "PVR Plaza", type: "cinema", address: "H Block, CP", lat: 28.6348, lng: 77.2201 },
    { name: "Haldiram's", type: "restaurant", address: "L-Block, CP", lat: 28.6312, lng: 77.2210 }
];

const STATIC_BIHAR_FALLBACK = [
    // --- PATNA ---
    // Hospitals
    { name: "AIIMS Patna", type: "hospital", address: "Phulwari Sharif, Patna, Bihar 801507", lat: 25.5600, lng: 85.0200 },
    { name: "Patna Medical College (PMCH)", type: "hospital", address: "Ashok Rajpath, Patna", lat: 25.6210, lng: 85.1520 },
    { name: "Indira Gandhi Institute of Medical Sciences", type: "hospital", address: "Sheikhpura, Bailey Road, Patna", lat: 25.6080, lng: 85.0920 },
    { name: "Paras HMRI Hospital", type: "hospital", address: "Raja Bazar, Patna", lat: 25.6075, lng: 85.0850 },
    { name: "Ruban Memorial Hospital", type: "hospital", address: "Patliputra Colony, Patna", lat: 25.6250, lng: 85.1100 },
    { name: "NMCH Patna", type: "hospital", address: "Kankarbagh, Patna", lat: 25.5940, lng: 85.1680 },

    // Banks
    { name: "SBI Main Branch Patna", type: "bank", address: "West of Gandhi Maidan, Patna", lat: 25.6170, lng: 85.1410 },
    { name: "HDFC Bank Exhibition Road", type: "bank", address: "Exhibition Road, Patna", lat: 25.6120, lng: 85.1450 },
    { name: "ICICI Bank Boring Road", type: "bank", address: "Boring Road, Patna", lat: 25.6200, lng: 85.1150 },
    { name: "Axis Bank Ltd", type: "bank", address: "Boring Road, Patna", lat: 25.6190, lng: 85.1160 },
    { name: "Bank of India Fraser Road", type: "bank", address: "Fraser Road, Patna", lat: 25.6100, lng: 85.1380 },

    // Restaurants
    { name: "Barbeque Nation Patna One", type: "restaurant", address: "8th Floor, Patna One Mall", lat: 25.6090, lng: 85.1370 },
    { name: "Mainland China Patna", type: "restaurant", address: "Bari Path, Patna", lat: 25.6150, lng: 85.1550 },
    { name: "Pind Balluchi Patna", type: "restaurant", address: "Biscomaun Bhawan, Patna", lat: 25.6205, lng: 85.1430 },
    { name: "KFC Patna Central", type: "restaurant", address: "Frazer Road, Patna", lat: 25.6085, lng: 85.1390 },
    { name: "Bikanervala Patna", type: "restaurant", address: "Exhibition Road, Patna", lat: 25.6115, lng: 85.1460 },

    // Pharmacies & Others
    { name: "Apollo Pharmacy Boring Road", type: "pharmacy", address: "Boring Road, Patna", lat: 25.6205, lng: 85.1145 },
    { name: "Popular Pharmacy Rajendra Nagar", type: "pharmacy", address: "Rajendra Nagar, Patna", lat: 25.6010, lng: 85.1580 },
    { name: "PVR Cinemas Patna", type: "cinema", address: "Patna Central Mall", lat: 25.6082, lng: 85.1385 },

    // --- MUZAFFARPUR ---
    // Hospitals
    { name: "Sadar Hospital Muzaffarpur", type: "hospital", address: "Muzaffarpur City", lat: 26.1180, lng: 85.3720 },
    { name: "SK Medical College Muzaffarpur", type: "hospital", address: "Uma Nagar, Muzaffarpur", lat: 26.1550, lng: 85.3950 },
    { name: "Prashant Memorial Charitable Hospital", type: "hospital", address: "Brahmapura, Muzaffarpur", lat: 26.1280, lng: 85.3650 },
    { name: "Minakshi Hospital", type: "hospital", address: "Brahmapura, Muzaffarpur", lat: 26.1290, lng: 85.3640 },

    // Banks
    { name: "ICICI Bank Club Road", type: "bank", address: "Club Road, Muzaffarpur", lat: 26.1150, lng: 85.3780 },
    { name: "HDFC Bank Chhoti Saraiyaganj", type: "bank", address: "Tilak Maidan Road, Muzaffarpur", lat: 26.1210, lng: 85.3750 },
    { name: "SBI Aghoria Bazar", type: "bank", address: "Aghoria Bazar, Muzaffarpur", lat: 26.1080, lng: 85.3620 },
    { name: "Bank of Baroda Kalambagh", type: "bank", address: "Kalambagh Road, Muzaffarpur", lat: 26.1120, lng: 85.3710 },

    // Restaurants
    { name: "Barbeque Nation Muzaffarpur", type: "restaurant", address: "Gannipur, Muzaffarpur", lat: 26.1050, lng: 85.3730 },
    { name: "Karim's Muzaffarpur", type: "restaurant", address: "Kalambagh Rd, Muzaffarpur", lat: 26.1110, lng: 85.3725 },
    { name: "Brewbakes Cafe", type: "restaurant", address: "Mithanpura, Muzaffarpur", lat: 26.1190, lng: 85.3850 },
    { name: "London Bridge Rooftop", type: "restaurant", address: "Mithanpura, Muzaffarpur", lat: 26.1185, lng: 85.3845 },

    // Pharmacies
    { name: "Apollo Pharmacy Mithanpura", type: "pharmacy", address: "Mithanpura, Muzaffarpur", lat: 26.1195, lng: 85.3855 },
    { name: "Medicone Bhagwanpur", type: "pharmacy", address: "Bhagwanpur, Muzaffarpur", lat: 26.1020, lng: 85.3350 },
];

// 3. Main Logic
async function fetchFromOSM(bbox) {
    const [s, w, n, e] = bbox;
    // FETCH EVERYTHING WITH A NAME - This is the "Universal Harvest"
    const query = `
        [out:json][timeout:180];
        (
          node["name"](${s},${w},${n},${e});
          way["name"](${s},${w},${n},${e});
        );
        out center;
    `;

    console.log(`Universal Fetch: [${s},${w},${n},${e}]...`);
    const endpoints = [
        "https://overpass-api.de/api/interpreter",
        "https://lz4.overpass-api.de/api/interpreter",
        "https://overpass.kumi.systems/api/interpreter"
    ];

    let lastError = null;
    for (const url of endpoints) {
        try {
            const response = await fetch(url, {
                method: "POST",
                body: query,
                signal: AbortSignal.timeout(60000)
            });
            if (!response.ok) continue;
            return await response.json();
        } catch (err) {
            lastError = err;
            continue;
        }
    }
    throw lastError || new Error("All endpoints failed");
}

async function start() {
    try {
        const CITIES_TO_GRID = ["Patna_Full", "Muzaffarpur_Full"];

        for (const [cityName, fullBbox] of Object.entries(CITIES)) {
            console.log(`\n--- STARTING UNIVERSAL HARVEST: ${cityName} ---`);

            let bboxes = [fullBbox];
            if (CITIES_TO_GRID.includes(cityName)) {
                console.log("Splitting city into 16 sectors...");
                const [s, w, n, e] = fullBbox;
                const latStep = (n - s) / 4;
                const lngStep = (e - w) / 4;
                bboxes = [];
                for (let i = 0; i < 4; i++) {
                    for (let j = 0; j < 4; j++) {
                        bboxes.push([
                            s + i * latStep,
                            w + j * lngStep,
                            s + (i + 1) * latStep,
                            w + (j + 1) * lngStep
                        ]);
                    }
                }
            }

            let cityTotal = 0;

            for (let bIndex = 0; bIndex < bboxes.length; bIndex++) {
                const bbox = bboxes[bIndex];
                process.stdout.write(`Sector ${bIndex + 1}/${bboxes.length}... `);

                try {
                    const data = await fetchFromOSM(bbox);
                    if (data.elements && data.elements.length > 0) {
                        const records = data.elements.map(el => {
                            const tags = el.tags || {};
                            // Intelligent type detection
                            const type = tags.amenity || tags.shop || tags.office || tags.leisure || tags.tourism || 'Business';

                            // Get lat/lng correctly (handling nodes vs ways)
                            const lat = el.lat || (el.center && el.center.lat);
                            const lng = el.lon || (el.center && el.center.lon);

                            if (!lat || !lng) return null;

                            return {
                                name: tags.name,
                                type: type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
                                address: tags["addr:full"] || tags["addr:street"] || "Bihar City",
                                lat: lat,
                                lng: lng,
                                rating: Math.floor(Math.random() * 2) + 3, // Random 3-5 rating
                                is_approved: true,
                                live_wait_time: Math.floor(Math.random() * 20),
                                average_service_time: 10,
                                opening_time: "09:00",
                                closing_time: "21:00"
                            };
                        }).filter(r => r !== null);

                        if (records.length > 0) {
                            // Chunked upsert to prevent payload limits
                            for (let i = 0; i < records.length; i += 100) {
                                const { error } = await supabase
                                    .from('places')
                                    .upsert(records.slice(i, i + 100), { onConflict: 'name,lat,lng' });
                                if (error) console.error("DB Error:", error.message);
                            }
                            cityTotal += records.length;
                            process.stdout.write(`Added ${records.length} locations.\n`);
                        } else {
                            process.stdout.write(`No valid records.\n`);
                        }
                    } else {
                        process.stdout.write(`Empty.\n`);
                    }
                } catch (err) {
                    process.stdout.write(`Failed: ${err.message}\n`);
                }

                // Small gap to avoid rate limits
                await new Promise(r => setTimeout(r, 1000));
            }

            console.log(`\n✅ ${cityName} HARVEST COMPLETE! TOTAL: ${cityTotal}`);
            console.log("-----------------------------------------");
        }
    } catch (err) {
        console.error(`Fatal error:`, err);
    }
}

start();
