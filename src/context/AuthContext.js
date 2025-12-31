"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);

    useEffect(() => {
        // 1. Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user || null);
            setIsAuthLoaded(true);
        });

        // 2. Auth Listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null);
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
