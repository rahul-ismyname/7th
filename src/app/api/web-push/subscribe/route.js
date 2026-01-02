import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
    try {
        const subscription = await request.json();

        // Init Supabase Server Client
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        // Save to DB
        // We match the columns: user_id, endpoint, keys (jsonb) or p256dh/auth?
        // Migration created: endpoint text, keys jsonb.
        const { error } = await supabase
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                keys: subscription.keys
            }, { onConflict: 'endpoint' });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Subscription error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
