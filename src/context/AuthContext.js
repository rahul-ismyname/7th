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
            const { data: { user }, error } = await supabase.auth.getUser();
            if (user) {
                // Fetch profile to get role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                setUser({ ...user, role: profile?.role || 'user' });
            } else {
                setUser(null);
            }
            setIsAuthLoaded(true);
        };
        initAuth();

        // 2. Auth Listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        // Fetch profile to get role on sign in
                        const { data: profile } = await supabase
                            .from('profiles')
                            .select('role')
                            .eq('id', session.user.id)
                            .single();

                        setUser({ ...session.user, role: profile?.role || 'user' });
                    } else {
                        setUser(session.user);
                    }
                } else {
                    setUser(null);
                }
                setIsAuthLoaded(true);
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
