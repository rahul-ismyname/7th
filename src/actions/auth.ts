"use server";

import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './email';

export async function signupUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Env Vars for Admin Client");
        return { error: "Server Configuration Error: Missing URLs/Keys" };
    }

    // Initialize Admin Client (Bypasses RLS, can manage users)
    // Init here to avoid module-level crashes if keys are missing
    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    if (!email || !password) return { error: "Email and password required" };

    try {
        // 1. Create User (Admin API prevents default Supabase email if we do it right? 
        // Actually, createUser doesn't trigger emails by default usually)
        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // User is NOT verified yet
            user_metadata: { role: 'user' }
        });

        if (createError) {
            // Check if user already exists
            const isExistingUser = createError.message?.toLowerCase().includes("registered") ||
                createError.message?.toLowerCase().includes("exists") ||
                createError.status === 422;

            if (!isExistingUser) {
                console.error("Create User Error:", createError);
                return { error: createError.message };
            }
            // If user exists, we proceed to try and generate a link (resend verification)
        }

        // Note: user.user might be null if we skipped the error, so we don't check it here.
        // We rely on generateLink using the 'email' and 'password' variables directly.


        // 2. Generate Confirmation Link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3000' : ''}/`
                // In prod, use actual domain
            }
        });

        if (linkError) {
            console.error("Link Gen Error:", linkError);
            return { error: "User created, but failed to generate verification link." };
        }

        const verificationLink = linkData.properties?.action_link;

        if (!verificationLink) {
            return { error: "Failed to retrieve verification link from Supabase." };
        }

        // 3. Send Custom Email via Resend
        const emailResult = await sendWelcomeEmail(email, verificationLink);

        if (!emailResult.success) {
            return { error: `User created, but email failed: ${emailResult.error}` };
        }

        return { success: true };

    } catch (err: any) {
        console.error("Signup Exception:", err);
        return { error: err.message || "Unknown server error" };
    }
}

import { sendPasswordResetEmail } from './email';

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get('email') as string;

    // Admin init (duplicated here or extracted? It's inside signupUser currently. 
    // Let's create a getAdminClient helper or just init again locally since we need scope safety)
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: "Configuration Error" };
    }

    const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'http://localhost:3000' : ''}/update-password`
            }
        });

        if (linkError) {
            console.error("Link Gen Error:", linkError);
            return { error: "Failed to generate reset link. " + linkError.message };
        }

        const recoveryLink = linkData.properties?.action_link;
        if (!recoveryLink) return { error: "Could not retrieve recovery link" };

        const emailResult = await sendPasswordResetEmail(email, recoveryLink);

        if (!emailResult.success) {
            const errString = emailResult?.error ?
                (typeof emailResult.error === 'object' && 'message' in (emailResult.error as any) ? (emailResult.error as any).message : JSON.stringify(emailResult.error))
                : "Unknown error";
            return { error: `Failed to send email: ${errString}` };
        }

        return { success: true };
    } catch (e: any) {
        return { error: e.message };
    }
}
