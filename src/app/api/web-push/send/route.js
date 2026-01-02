import { NextResponse } from 'next/server';
import { webPush } from '@/lib/web-push';
import { createClient } from '@/lib/supabase-server';

export async function POST(request) {
    try {
        const { userId, title, body } = await request.json();

        // 1. Verify Admin or Authorized?
        // For now, let's just check if user is authenticated (simple link)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch subscriptions for target userId
        // If testing, we might pass subscription object directly, but in prod we use userId

        let subscriptions = [];

        if (userId) {
            const { data, error } = await supabase
                .from('push_subscriptions')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            subscriptions = data;
        } else {
            // Fallback for testing: if request body has 'subscription' object
            const bodyJson = await request.json().catch(() => ({}));
            if (bodyJson.subscription) {
                subscriptions = [{ endpoint: bodyJson.subscription.endpoint, keys: bodyJson.subscription.keys }];
            }
        }

        if (subscriptions.length === 0) {
            return NextResponse.json({ message: 'No subscriptions found' });
        }

        const results = await Promise.allSettled(subscriptions.map(sub => {
            const pushSubscription = {
                endpoint: sub.endpoint,
                keys: sub.keys
            };

            return webPush.sendNotification(pushSubscription, JSON.stringify({
                title,
                body,
                icon: '/icon-192.png'
            }));
        }));

        // Log failures (410 Gone means unsubscribe)
        // Ideally we delete expired subscriptions here

        return NextResponse.json({
            success: true,
            results: results.map(r => r.status)
        });

    } catch (err) {
        console.error('Send error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
