"use client";

import { useState } from "react";
import { usePlaces } from "@/context/PlacesContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, LogOut, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
    const { user, signOut } = usePlaces();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile State
    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: displayName }
            });

            if (error) throw error;
            setMessage({ type: 'success', text: "Profile updated successfully!" });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: "Passwords do not match." });
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setMessage({ type: 'error', text: "Password must be at least 6 characters." });
            setLoading(false);
            return;
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;
            setMessage({ type: 'success', text: "Password updated successfully!" });
            setPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
                    <Link href="/login" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Log In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
                <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Link>
                        <h1 className="font-bold text-lg">My Profile</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto p-6 space-y-8">
                {/* User Info Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-3xl font-black mx-auto mb-4">
                        {(displayName?.[0] || user.email?.[0] || "U").toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{displayName || "User"}</h2>
                    <p className="text-slate-500 text-sm font-medium">{user.email}</p>
                </div>

                {message && (
                    <div className={cn(
                        "p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-in fade-in slide-in-from-top-4",
                        message.type === 'success' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                        {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        {message.text}
                    </div>
                )}

                {/* Edit Profile Form */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <User className="w-5 h-5 text-indigo-600" /> Edit Profile
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Display Name</label>
                            <input
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 ring-indigo-500/10 outline-none"
                                placeholder="Your Name"
                            />
                        </div>
                        <button
                            disabled={loading}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </div>

                {/* Change Password Form */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600" /> Change Password
                    </h3>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 ring-indigo-500/10 outline-none"
                                placeholder="At least 6 characters"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 ring-indigo-500/10 outline-none"
                                placeholder="Repeat password"
                            />
                        </div>
                        <button
                            disabled={loading || !password}
                            className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Sign Out */}
                <button
                    onClick={() => signOut()}
                    className="w-full py-4 text-rose-500 font-bold hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" /> Sign Out
                </button>
            </main>
        </div>
    );
}
