"use server";

import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from './email';

export async function signupUser(formData) {
    const email = formData.get('email');
    const password = formData.get('password');

    const role = formData.get('role') || 'user'; // Default to user if not specified

    // Validate role to prevent arbitrary role assignment if we had admin roles
    const safeRole = ['user', 'vendor'].includes(role) ? role : 'user';

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("Missing Env Vars for Admin Client");
        return { error: "Server Configuration Error: Missing URLs/Keys" };
    }

    // Initialize Admin Client (Bypasses RLS, can manage users)
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
        // 1. Create User
        const { data: user, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: false, // User is NOT verified yet
            user_metadata: { role: safeRole }
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


        // Determine Base URL
        // FORCE PRODUCTION URL as requested by user
        const BASE_URL = 'https://7th-l2kk.vercel.app';
        console.log("Signup BASE_URL forced to:", BASE_URL);

        // 2. Generate Confirmation Link
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email: email,
            password: password,
            options: {
                redirectTo: BASE_URL // Remove trailing slash to match Supabase whitelist exactly
            }
        });

        if (linkError) {
            // Fallback: If user already exists, 'signup' link fails. 
            // We use 'magiclink' instead, which verifies the email and logs them in.
            if (linkError.message?.includes("already") || linkError.message?.includes("register")) {
                console.log("User exists, falling back to 'magiclink' type for verification.");
                const { data: magicData, error: magicError } = await supabaseAdmin.auth.admin.generateLink({
                    type: 'magiclink',
                    email: email,
                    options: { redirectTo: BASE_URL }
                });

                if (magicError) {
                    console.error("MagicLink Gen Error:", magicError);
                    return { error: `Verification Failed: ${magicError.message}` };
                }

                // Use the new link
                const magicLink = magicData.properties?.action_link;
                if (magicLink) {
                    // Send this link via email
                    const emailResult = await sendWelcomeEmail(email, magicLink);
                    if (!emailResult.success) {
                        return { error: `Email Failed: ${emailResult.error}` };
                    }
                    return { success: true, message: "Account exists. Verification email resent! Check your inbox." };
                }
            }

            console.error("Link Gen Error:", linkError);
            return { error: `Link Gen Failed: ${linkError.message || linkError}` };
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

        return { success: true, message: "Account created! Please verify your email via the link sent to your inbox." };

    } catch (err) {
        console.error("Signup Exception:", err);
        return { error: err.message || "Unknown server error" };
    }
}

import { sendPasswordResetEmail } from './email';

export async function requestPasswordReset(formData) {
    const email = formData.get('email');

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

    const BASE_URL = 'https://7th-l2kk.vercel.app';

    try {
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: `${BASE_URL}/update-password`
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
                (typeof emailResult.error === 'object' && 'message' in emailResult.error ? emailResult.error.message : JSON.stringify(emailResult.error))
                : "Unknown error";
            return { error: `Failed to send email: ${errString}` };
        }

        return { success: true };
    } catch (e) {
        return { error: e.message };
    }
}
