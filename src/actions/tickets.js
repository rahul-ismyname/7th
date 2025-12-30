"use server";

import { createClient } from '@supabase/supabase-js';

// Initialize Admin Client
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function submitReviewAction(ticketId, reviewData) {
    try {
        const updateData = {};

        if (reviewData.actualWaitTime) updateData.actual_wait_time = reviewData.actualWaitTime;
        if (reviewData.counterUsed) updateData.counter_used = reviewData.counterUsed;

        // 1. Update Ticket (Admin access bypasses RLS on 'completed' rows if enforced)
        const { data: ticketData, error } = await supabaseAdmin
            .from('tickets')
            .update(updateData)
            .eq('id', ticketId)
            .select('place_id')
            .single();

        if (error) {
            console.error("Server Action: Error updating ticket:", error);
            return { success: false, error: error.message };
        }

        // 2. Update Place Stats (EMA)
        if (reviewData.actualWaitTime && ticketData?.place_id) {
            const placeId = ticketData.place_id;

            // Fetch current place stats
            const { data: place, error: placeError } = await supabaseAdmin
                .from('places')
                .select('average_service_time')
                .eq('id', placeId)
                .single();

            if (place) {
                const oldAvg = place.average_service_time || 5;
                const reportedTime = Number(reviewData.actualWaitTime);
                const alpha = 0.1; // 10% weight to new feedback

                const newAvg = Math.round((oldAvg * (1 - alpha)) + (reportedTime * alpha));

                if (newAvg !== oldAvg) {
                    const { error: updateError } = await supabaseAdmin
                        .from('places')
                        .update({ average_service_time: newAvg })
                        .eq('id', placeId);

                    if (updateError) {
                        console.error("Server Action: Failed to update place stats:", updateError);
                    }
                }
            }
        }

        return { success: true };
    } catch (err) {
        console.error("Server Action: Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
