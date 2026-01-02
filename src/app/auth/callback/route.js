import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)
        console.log("Auth Callback - Exchange Code Result:", {
            hasSession: !!data?.session,
            user: data?.session?.user?.email,
            error: error
        });

        if (!error) {
            let next = searchParams.get('next')
            const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
            const isLocalEnv = process.env.NODE_ENV === 'development'

            // Priority: Check for cookie (Force override if present)
            // Reuse existing cookieStore from line 10
            const nextCookie = cookieStore.get('waitly_next');
            if (nextCookie?.value) {
                next = nextCookie.value;
                // Delete the cookie so it doesn't persist for future generic logins
                cookieStore.set('waitly_next', '', { maxAge: 0, path: '/' });
            }

            // Fallback: Check if user is a vendor
            if (!next) {
                const role = data?.session?.user?.user_metadata?.role;
                if (role === 'vendor') {
                    next = '/vendor';
                }
            }

            // Account Merging: Check if user is logging in with vendor intent but doesn't have the role
            if (next?.includes('/vendor')) {
                const currentRole = data?.session?.user?.user_metadata?.role;
                if (currentRole !== 'vendor') {
                    // Upgrade user to vendor
                    await supabase.auth.updateUser({
                        data: { role: 'vendor' }
                    });
                }
            }

            if (next) {
                console.log("Auth Callback - Redirecting to next:", next);
                // If in production with forwarded host (Vercel), ensure we use that domain
                if (forwardedHost && !isLocalEnv) {
                    return NextResponse.redirect(`https://${forwardedHost}${next}`)
                }
                return NextResponse.redirect(`${origin}${next}`)
            }
            console.log("Auth Callback - Redirecting to root");
            return NextResponse.redirect(`${origin}`)
        } else {
            console.error("Auth Callback - Exchange Code Error:", error);
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?error=auth_code_error`)
}
