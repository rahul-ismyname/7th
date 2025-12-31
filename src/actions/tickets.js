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
        if (reviewData.rating) updateData.rating = reviewData.rating;
        if (reviewData.reviewText) updateData.review_text = reviewData.reviewText;

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

        // 2. Update Place Stats (EMA for time, Moving Average for Rating)
        if (ticketData?.place_id) {
            const placeId = ticketData.place_id;

            // Fetch current place stats
            const { data: place, error: placeError } = await supabaseAdmin
                .from('places')
                .select('average_service_time, rating, rating_count')
                .eq('id', placeId)
                .single();

            if (place) {
                const updates = {};

                // Update Service Time (EMA)
                if (reviewData.actualWaitTime) {
                    const oldAvg = place.average_service_time || 5;
                    const reportedTime = Number(reviewData.actualWaitTime);
                    const alpha = 0.1; // 10% weight to new feedback
                    updates.average_service_time = Math.round((oldAvg * (1 - alpha)) + (reportedTime * alpha));
                }

                // Update Rating (Cumulative Moving Average)
                if (reviewData.rating) {
                    const currentRating = place.rating || 0;
                    const currentCount = place.rating_count || 0;
                    const newRatingVal = Number(reviewData.rating);

                    const newCount = currentCount + 1;
                    // Calculate new average: (old * count + new) / (count + 1)
                    // limit to 1 decimal place
                    const newRating = Math.round(((currentRating * currentCount) + newRatingVal) / newCount * 10) / 10;

                    updates.rating = newRating;
                    updates.rating_count = newCount;
                }

                if (Object.keys(updates).length > 0) {
                    const { error: updateError } = await supabaseAdmin
                        .from('places')
                        .update(updates)
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
