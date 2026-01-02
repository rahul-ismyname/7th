"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);

    useEffect(() => {
        // 1. Get initial session with fresh user data
        const initAuth = async () => {
            console.log("AuthContext: initAuth started");
            try {
                const { data: { user }, error } = await supabase.auth.getUser();
                console.log("AuthContext: getUser result:", { user: user?.email, error });

                if (user) {
                    console.log("AuthContext: Fetching profile for role...");
                    // Fetch profile to get role
                    const { data: profile, error: profileError } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.warn("AuthContext: Profile fetch error (non-critical):", profileError);
                    }

                    setUser({ ...user, role: profile?.role || 'user' });
                    console.log("AuthContext: User set with role:", profile?.role || 'user');
                } else {
                    setUser(null);
                }
            } catch (err) {
                console.error("AuthContext: initAuth exception:", err);
            } finally {
                setIsAuthLoaded(true);
                console.log("AuthContext: isAuthLoaded set to true");
            }
        };
        initAuth();

        // 2. Auth Listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log("AuthContext: onAuthStateChange event:", event, "User:", session?.user?.email);
                try {
                    if (session?.user) {
                        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                            console.log("AuthContext: Fetching profile for role (listener)...");

                            // Timeout wrapper for DB call
                            const fetchProfileWithTimeout = async () => {
                                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2000));
                                const fetch = supabase
                                    .from('profiles')
                                    .select('role')
                                    .eq('id', session.user.id)
                                    .single();
                                return Promise.race([timeout, fetch]);
                            };

                            let profile = null;
                            try {
                                const { data } = await fetchProfileWithTimeout();
                                profile = data;
                            } catch (e) {
                                console.warn("AuthContext: Profile fetch timed out or failed, defaulting to user role");
                            }

                            setUser({ ...session.user, role: profile?.role || 'user' });
                        } else {
                            setUser(session.user);
                        }
                    } else {
                        setUser(null);
                    }
                } catch (err) {
                    console.error("AuthContext: listener exception:", err);
                } finally {
                    setIsAuthLoaded(true);
                }
            }
        );

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem("waitly_mode");
        }
        setUser(null);
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, isAuthLoaded, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
