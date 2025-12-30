"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Store, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { signupUser, requestPasswordReset } from "@/actions/auth";

export default function VendorLoginPage() {
    const [mode, setMode] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const router = useRouter();

    const handleAuth = async (e) => {
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
                    setMessage("Recovery link sent! Check your email.");
                }
            } else if (mode === "signup") {
                const formData = new FormData();
                formData.append('email', email);
                formData.append('password', password);
                formData.append('role', 'vendor'); // Explicitly request vendor role

                const result = await signupUser(formData);

                if (result.error) {
                    setMessage(result.error);
                } else {
                    setMessage("Account created! Please verify your email.");
                    setEmail("");
                    setPassword("");
                }
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    setMessage(error.message);
                } else {
                    setMessage("Success! Taking you to your dashboard...");
                    router.push("/vendor");
                    router.refresh();
                }
            }
        } catch (err) {
            setMessage("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900 relative overflow-hidden">
            {/* Soft decorative blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-indigo-100/60 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-100/60 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] left-[60%] w-[400px] h-[400px] bg-purple-100/60 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-6xl mx-auto flex items-center justify-center p-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 w-full items-center">

                    {/* Left: Login Form */}
                    <div className="w-full max-w-md mx-auto">
                        <Link href="/login" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-8 group">
                            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                            Back to User Login
                        </Link>

                        <div className="mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-200 rotate-3">
                                <Store className="w-7 h-7 text-white" />
                            </div>
                            <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-3">
                                {mode === 'signup' ? 'Partner with Waitly.' : (mode === 'forgot' ? 'Reset Access.' : 'Welcome Back.')}
                            </h1>
                            <p className="text-slate-500 font-medium text-lg leading-relaxed">
                                {mode === 'signup' ? 'Join thousands of businesses streamlining their queues.' : 'Manage your business and customers efficiently.'}
                            </p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-6 bg-white p-8 rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-slate-100">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Business Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-5 py-4 bg-slate-50 focus:bg-white text-slate-900 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-bold placeholder:text-slate-300"
                                        placeholder="owner@business.com"
                                    />
                                </div>

                                {mode !== "forgot" && (
                                    <div className="animate-in slide-in-from-top-2 fade-in">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Password</label>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 focus:bg-white text-slate-900 rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all outline-none font-bold placeholder:text-slate-300"
                                            placeholder="••••••••••••"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                {mode === "signin" ? (
                                    <button type="button" onClick={() => { setMode("signup"); setMessage(null); }} className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                                        Create New Account
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => { setMode("signin"); setMessage(null); }} className="text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                                        Back to Sign In
                                    </button>
                                )}

                                {mode === "signin" && (
                                    <button type="button" onClick={() => { setMode("forgot"); setMessage(null); }} className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                        Forgot Password?
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 transform active:scale-[0.98]"
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (mode === 'signin' ? 'Go to Dashboard' : (mode === 'signup' ? 'Create Business Account' : 'Send Recovery Link'))}
                            </button>

                            {message && (
                                <div className={`p-4 rounded-2xl text-sm font-bold text-center animate-in fade-in slide-in-from-bottom-2 ${message.includes("Success") || message.includes("Recovery") || message.includes("created") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                                    {message}
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Right: Friendly Illustrations/Content */}
                    <div className="hidden lg:block">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-100 to-violet-100 rounded-[3rem] -rotate-2 transform scale-105 opacity-50" />
                            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-100 rounded-bl-[100px] -mr-8 -mt-8 opacity-50" />

                                <div className="mb-8">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                        <Sparkles className="w-4 h-4" /> Trusted by 500+ Businesses
                                    </span>
                                    <h2 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                                        Make your customers<br />happier, instantly.
                                    </h2>
                                    <p className="text-slate-500 font-medium">Waitly helps you manage crowds, prevent walk-aways, and give your customers the freedom to roam while they wait.</p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        "Zero hardware required",
                                        "Instant QR code setup",
                                        "Real-time analytics",
                                        "Customer satisfaction guaranteed"
                                    ].map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                            </div>
                                            <span className="font-bold text-slate-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center gap-4">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500`} style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 10})`, backgroundSize: 'cover' }}></div>
                                        ))}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-bold text-slate-900">Join the community</p>
                                        <p className="text-slate-500">Start your 14-day free trial</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
