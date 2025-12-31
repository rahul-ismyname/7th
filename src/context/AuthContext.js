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
            if (error) {
                // Fallback to session check if getUser fails (e.g. network), though usually error means not logged in
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user || null);
            } else {
                setUser(user);
            }
            setIsAuthLoaded(true);
        };
        initAuth();

        // 2. Auth Listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    // On sign in, we might want to ensure we have the latest claims
                    // But for performance, we'll try to stick to session, unless it's a dedicated refresh
                    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                        // Optionally fetch fresh user here too, but start with session to be responsive
                        setUser(session.user);
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
