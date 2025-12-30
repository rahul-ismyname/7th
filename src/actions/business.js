"use server";

import { createClient } from '@supabase/supabase-js';
import { sendDeletionConfirmationEmail } from './email';
import crypto from 'crypto';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Store deletion tokens temporarily (in production, use Redis or database)
const deletionTokens = new Map();

export async function requestBusinessDeletion(placeId, userEmail, businessName) {
    try {
        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');

        // Store token with 1 hour expiry
        deletionTokens.set(token, {
            placeId,
            expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
        });

        // Generate confirmation link
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        const deleteLink = `${baseUrl}/api/confirm-delete?token=${token}`;

        // Send confirmation email
        const result = await sendDeletionConfirmationEmail(userEmail, businessName, deleteLink);

        if (!result.success) {
            return { success: false, error: 'Failed to send confirmation email' };
        }

        return { success: true, message: 'Confirmation email sent' };
    } catch (error) {
        console.error('Deletion request error:', error);
        return { success: false, error: 'Failed to process deletion request' };
    }
}

export async function confirmBusinessDeletion(token) {
    try {
        const tokenData = deletionTokens.get(token);

        if (!tokenData) {
            return { success: false, error: 'Invalid or expired token' };
        }

        if (Date.now() > tokenData.expiresAt) {
            deletionTokens.delete(token);
            return { success: false, error: 'Token has expired' };
        }

        // Delete the business using admin client
        const { error } = await supabaseAdmin
            .from('places')
            .delete()
            .eq('id', tokenData.placeId);

        if (error) {
            console.error('Delete error:', error);
            return { success: false, error: 'Failed to delete business' };
        }

        // Clean up token
        deletionTokens.delete(token);

        return { success: true, message: 'Business deleted successfully' };
    } catch (error) {
        console.error('Confirm deletion error:', error);
        return { success: false, error: 'Failed to confirm deletion' };
    }
}
