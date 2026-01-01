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

        // 2. Update Place Stats via Atomic RPC
        if (ticketData?.place_id) {
            const { error: rpcError } = await supabaseAdmin.rpc('update_place_stats', {
                p_place_id: ticketData.place_id,
                p_reported_wait_time: reviewData.actualWaitTime ? Number(reviewData.actualWaitTime) : null,
                p_new_rating: reviewData.rating ? Number(reviewData.rating) : null
            });

            if (rpcError) {
                console.error("Server Action: Failed to update place stats via RPC:", rpcError);
            }
        }

        return { success: true };
    } catch (err) {
        console.error("Server Action: Unexpected error:", err);
        return { success: false, error: err.message };
    }
}
