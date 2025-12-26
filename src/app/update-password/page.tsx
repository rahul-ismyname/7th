"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CheckCircle, AlertCircle } from "lucide-react";

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    // Check if we have a session (Recovery link logs us in automatically)
    useEffect(() => {
        const checkSession = async () => {
            const { data } = await supabase.auth.getSession();
            if (!data.session) {
                // If no session, the link might be invalid or expired
                setMessage({ type: 'error', text: "Invalid or expired reset link. Please try again." });
            }
        };
        checkSession();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setMessage({ type: 'error', text: "Passwords do not match" });
            return;
        }

        setIsLoading(true);
        setMessage(null);

        const { error } = await supabase.auth.updateUser({ password: password });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: "Password updated successfully!" });
            setTimeout(() => {
                router.push('/'); // Go to dashboard
            }, 2000);
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCFD] text-slate-900 font-sans p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-slate-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">New Password</h1>
                    <p className="text-slate-500 font-medium">Secure your account with a new password.</p>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold placeholder:font-medium"
                            placeholder="••••••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-5 py-4 bg-slate-50 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold placeholder:font-medium"
                            placeholder="••••••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update Password"}
                    </button>

                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
