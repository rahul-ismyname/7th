"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Compass, KeyRound, Store } from "lucide-react";
import Link from "next/link";
import { signupUser, requestPasswordReset } from "@/actions/auth";

export default function LoginPage() {
    const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        try {
            if (mode === "forgot") {
                const formData = new FormData();
                formData.append('email', email);
                const result = await requestPasswordReset(formData);
                if (result.error) {
                    setMessage(result.error);
                } else {
                    setMessage("Recovery link sent! (It may take 1-2 mins to arrive)");
                    // Optional: Switch back to signin after a delay?
                }
            } else if (mode === "signup") {
                // Use Server Action for Signup (Manual Verification Flow)
                const formData = new FormData();
                formData.append('email', email);
                formData.append('password', password);

                const result = await signupUser(formData);

                if (result.error) {
                    setMessage(result.error);
                } else {
                    setMessage("Account created! Please verify your email via the link sent to your inbox.");
                    setEmail("");
                    setPassword("");
                }
            } else {
                // Sign In
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    setMessage(error.message);
                } else {
                    setMessage("Success! Redirecting...");
                    router.push("/");
                    router.refresh();
                }
            }
        } catch (err: any) {
            setMessage("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper texts
    const getTitle = () => {
        if (mode === "forgot") return "Recover.";
        if (mode === "signup") return "Join.";
        return "Waitly.";
    };

    const getSubtitle = () => {
        if (mode === "forgot") return "Enter your email to reset access.";
        if (mode === "signup") return "The future of waiting is here.";
        return "Visualize your time. Skip the line.";
    };

    const getButtonText = () => {
        if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
        if (mode === "forgot") return "Send Link";
        if (mode === "signup") return "Get Access";
        return "Enter Portal";
    };

    return (
        <div className="min-h-screen w-full flex bg-[#FDFCFD] relative overflow-hidden font-sans selection:bg-indigo-100 text-slate-900">
            {/* LEFT SIDE - FORM SECTION */}
            <div className="w-full lg:w-[45%] xl:w-[40%] relative z-20 flex flex-col p-8 md:p-16 lg:p-20 bg-gradient-to-br from-indigo-50/80 via-white/90 to-rose-50/80 backdrop-blur-xl border-r border-white/50 shadow-[20px_0_40px_rgba(0,0,0,0.02)]">

                {/* Decorative background elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
                    <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-100/40 rounded-full blur-[80px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-100/40 rounded-full blur-[80px]" />
                </div>

                {/* Header */}
                <div className="flex justify-between items-center mb-16">
                    <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back
                    </Link>
                </div>

                {/* Form */}
                <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full animate-in slide-in-from-left-4 duration-700 fade-in fill-mode-both">

                    <div className="mb-10 relative">
                        <div className="relative w-16 h-16 bg-gradient-to-tr from-indigo-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-indigo-500/20 rotate-3 transition-transform duration-500 hover:rotate-6 hover:scale-105 cursor-default">
                            {mode === "forgot" ? <KeyRound className="w-8 h-8" /> : <Compass className="w-8 h-8" />}
                        </div>
                        <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 mb-3">
                            {getTitle()}
                        </h1>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed">
                            {getSubtitle()}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-5">
                            <div className="group relative">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 bg-white/70 text-slate-900 rounded-2xl border border-indigo-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold placeholder:text-slate-300 placeholder:font-medium shadow-sm"
                                    placeholder="name@work.com"
                                />
                            </div>

                            {mode !== "forgot" && (
                                <div className="group relative animate-in slide-in-from-top-2 fade-in">
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-5 py-4 bg-white/70 text-slate-900 rounded-2xl border border-indigo-100 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none font-bold placeholder:text-slate-300 placeholder:font-medium shadow-sm"
                                        placeholder="••••••••••••"
                                        minLength={6}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            {mode === "forgot" ? (
                                <button type="button"
                                    onClick={() => {
                                        setMode("signin");
                                        setMessage(null);
                                    }}
                                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                                >
                                    Cancel
                                </button>
                            ) : (
                                <button type="button"
                                    onClick={() => {
                                        setMode(mode === "signin" ? "signup" : "signin");
                                        setMessage(null);
                                    }}
                                    className="text-sm font-bold text-indigo-500 hover:text-indigo-700 transition-colors"
                                >
                                    {mode === "signin" ? "Create ID" : "Log In"}
                                </button>
                            )}

                            {mode === "signin" && (
                                <button type="button"
                                    onClick={() => {
                                        setMode("forgot");
                                        setMessage(null);
                                    }}
                                    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                    Forgot?
                                </button>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full bg-gradient-to-r ${mode === 'forgot' ? 'from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600' : 'from-slate-900 to-slate-800 hover:from-black hover:to-slate-900'} text-white font-bold py-5 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-tight shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-slate-900/20 active:scale-[0.98] mt-4 group/btn relative overflow-hidden`}
                        >
                            <span className="relative z-10 flex items-center gap-3">
                                {getButtonText()}
                                {!isLoading && <ArrowLeft className="w-5 h-5 rotate-180 group-hover/btn:translate-x-1 transition-transform" />}
                            </span>
                        </button>

                        {message && (
                            <div className={`mt-4 p-4 rounded-2xl text-sm font-bold text-center animate-in fade-in slide-in-from-bottom-2 ${message.includes("Success") || message.includes("Recovery") || message.includes("created") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                                {message}
                            </div>
                        )}
                    </form>
                </div>
                <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
                    <p className="text-slate-400 font-medium text-xs uppercase tracking-widest mb-3">Partner Access</p>
                    <Link href="/vendor/login" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-full text-slate-600 font-bold text-sm transition-all hover:pr-6 group">
                        <Store className="w-4 h-4 text-indigo-500" />
                        <span>Business & Vendor Login</span>
                        <ArrowLeft className="w-4 h-4 rotate-180 opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    </Link>
                </div>
            </div>

            {/* RIGHT SIDE - VISUALS */}
            <div className="hidden lg:block flex-1 relative bg-gradient-to-br from-slate-50 to-[#FAFAFA] overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {/* Same Abstract Clock as before, kept simple here to save chars, in real file ensure it's preserved. */}
                    {/* Ideally I should use replace_file_content to KEEP the massive SVG art intact instead of rewriting it. 
                        Wait, write_to_file replaces EVERYTHING. 
                        I should double check if I have the full content of the SVG art from previous reads.
                        Step 1106 has lines 1-205. Lines 153-194 contain the SVG art. 
                        I will include it below to ensure no regression.
                     */}
                    <div className="relative w-[750px] h-[750px] rounded-full bg-gradient-to-tr from-indigo-50 via-white to-pink-50 shadow-2xl flex items-center justify-center animate-[float_10s_ease-in-out_infinite] will-change-transform">
                        <div className="absolute inset-0 rounded-full border-[2px] border-indigo-100/50 animate-[pulse_4s_ease-in-out_infinite]" />
                        <div className="absolute inset-40 rounded-full border-[1px] border-rose-100/50 animate-[pulse_5s_ease-in-out_infinite_reverse]" />
                        <div className="absolute w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/20 via-purple-200/20 to-rose-200/20 rounded-full blur-2xl animate-[spin_30s_linear_infinite] will-change-transform" />
                        <div className="absolute w-[4px] h-[340px] bg-gradient-to-t from-transparent via-indigo-400 to-fuchsia-400 rounded-full origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 animate-[spin_60s_linear_infinite] opacity-70 z-20 will-change-transform" />
                        <div className="absolute w-16 h-16 bg-white rounded-full shadow-xl flex items-center justify-center z-30 ring-1 ring-white/50 backdrop-blur-sm">
                            <div className="w-6 h-6 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full shadow-inner" />
                        </div>
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className={`absolute w-1 rounded-full origin-bottom bottom-1/2 left-1/2 -translate-x-1/2 ${i % 3 === 0 ? 'h-16 bg-indigo-200' : 'h-8 bg-slate-200'}`}
                                style={{ transform: `translateX(-50%) rotate(${i * 30}deg) translateY(-320px)` }}
                            />
                        ))}
                    </div>

                    <div className="absolute top-[20%] right-[15%] w-32 h-32 bg-gradient-to-br from-cyan-100 to-blue-200 rounded-full blur-lg opacity-50 animate-[float_12s_ease-in-out_infinite_reverse] will-change-transform" />
                    <div className="absolute bottom-[25%] left-[20%] w-48 h-48 bg-gradient-to-tr from-fuchsia-100 to-purple-200 rounded-full blur-xl opacity-50 animate-[float_15s_ease-in-out_infinite] will-change-transform" />
                    <div className="absolute top-[15%] left-[40%] w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full blur-md opacity-60 animate-[float_8s_ease-in-out_infinite_delay-1000] will-change-transform" />

                    <div className="absolute bottom-12 right-12 text-right opacity-40">
                        <p className="text-xs font-bold tracking-[0.8em] text-indigo-900/40 uppercase">A E S T H E T I C</p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-30px); }
                }
            `}</style>
        </div>
    );
}
