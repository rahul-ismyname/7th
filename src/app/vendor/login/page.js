"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Store, CheckCircle2, Users, BarChart3, Zap, KeyRound, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signupUser, requestPasswordReset } from "@/actions/auth";
import Logo from "@/components/Logo";

export default function VendorLoginPage() {
    const [mode, setMode] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
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
                formData.append('role', 'vendor');

                const result = await signupUser(formData);

                if (result.error) {
                    setMessage(result.error);
                } else {
                    setMessage("Account created! Please verify your email.");
                    setEmail("");
                    setPassword("");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) {
                    setMessage(error.message);
                } else {
                    setMessage("Success! Redirecting to dashboard...");
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

    const getTitle = () => {
        if (mode === "forgot") return "Reset Password";
        if (mode === "signup") return "Start Free Trial";
        return "Business Portal";
    };

    const getSubtitle = () => {
        if (mode === "forgot") return "We'll send you a recovery link";
        if (mode === "signup") return "14 days free, no credit card required";
        return "Sign in to your dashboard";
    };

    const getButtonText = () => {
        if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
        if (mode === "forgot") return "Send Reset Link";
        if (mode === "signup") return "Create Business Account";
        return "Access Dashboard";
    };

    const features = [
        { icon: Users, title: "Queue Management", desc: "Handle customers efficiently" },
        { icon: BarChart3, title: "Real-time Analytics", desc: "Track wait times & flow" },
        { icon: Zap, title: "Instant Notifications", desc: "Alert customers automatically" },
    ];

    return (
        <div className="h-[100dvh] w-full flex bg-slate-900 overflow-hidden">
            {/* Left Panel - Visual */}
            <div className="hidden lg:flex w-[55%] xl:w-[60%] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative items-center justify-center overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {/* Gradient Orbs */}
                <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-violet-600/20 rounded-full blur-[100px]" />

                {/* Content */}
                <div className="relative z-10 px-10 xl:px-16 max-w-xl">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <Logo className="w-10 h-10 text-white" />
                        <div>
                            <span className="font-black text-xl text-white tracking-tight">Waitly</span>
                            <span className="text-indigo-400 font-bold ml-2 text-xs">for Business</span>
                        </div>
                    </div>

                    <h1 className="text-3xl xl:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
                        Streamline your queues.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Delight your customers.</span>
                    </h1>

                    <p className="text-slate-400 text-base mb-6 max-w-md">
                        Join 500+ businesses using Waitly to reduce wait times and boost efficiency.
                    </p>

                    {/* Features - More Compact */}
                    <div className="space-y-2">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500/20 to-violet-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30 shrink-0">
                                    <feature.icon className="w-5 h-5 text-indigo-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-white text-sm">{feature.title}</div>
                                    <div className="text-xs text-slate-500">{feature.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Testimonial - Compact */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-800 bg-slate-600" style={{ backgroundImage: `url(https://i.pravatar.cc/100?img=${i + 20})`, backgroundSize: 'cover' }} />
                                ))}
                            </div>
                            <div>
                                <div className="flex items-center gap-0.5 text-yellow-400 text-xs">
                                    {[1, 2, 3, 4, 5].map(i => <span key={i}>★</span>)}
                                </div>
                                <div className="text-slate-500 text-xs">Trusted by business owners</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col bg-white">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <Link href="/login" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors">
                        ← User Login
                    </Link>
                    <div className="lg:hidden flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            W
                        </div>
                        <span className="font-bold text-slate-900">Waitly</span>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-12">
                    <div className="max-w-sm mx-auto w-full">
                        {/* Icon & Title */}
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200/50">
                                {mode === "forgot" ? <KeyRound className="w-6 h-6 text-white" /> : <Store className="w-6 h-6 text-white" />}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                                {getTitle()}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {getSubtitle()}
                            </p>
                        </div>

                        {/* Google OAuth for Business */}
                        {mode !== "forgot" && (
                            <>
                                <button
                                    onClick={async () => {
                                        setIsLoading(true);
                                        // Set cookie validation for 10 minutes
                                        localStorage.setItem("waitly_mode", "vendor");

                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/vendor')}`,
                                                data: { role: 'vendor' }
                                            },
                                        });
                                        if (error) {
                                            setMessage(error.message);
                                            setIsLoading(false);
                                        }
                                    }}
                                    className="w-full bg-white border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-3 shadow-sm"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Continue with Google
                                </button>

                                <div className="relative my-5">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200"></div>
                                    </div>
                                    <div className="relative flex justify-center text-xs">
                                        <span className="bg-white px-3 text-slate-400 font-medium">or use email</span>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Email Form */}
                        <form onSubmit={handleAuth} className="space-y-4">
                            <div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium placeholder:text-slate-400"
                                    placeholder="Business email"
                                />
                            </div>

                            {mode !== "forgot" && (
                                <div>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 text-slate-900 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all outline-none font-medium placeholder:text-slate-400 pr-12"
                                            placeholder="Password"
                                            minLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Actions Row */}
                            <div className="flex justify-between items-center text-sm">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMode(mode === "signin" ? "signup" : "signin");
                                        setMessage(null);
                                    }}
                                    className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                                >
                                    {mode === "signin" ? "Create account" : "Already have an account?"}
                                </button>

                                {mode === "signin" && (
                                    <button
                                        type="button"
                                        onClick={() => { setMode("forgot"); setMessage(null); }}
                                        className="font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Forgot password?
                                    </button>
                                )}

                                {mode === "forgot" && (
                                    <button
                                        type="button"
                                        onClick={() => { setMode("signin"); setMessage(null); }}
                                        className="font-medium text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        Back to sign in
                                    </button>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-indigo-200 hover:shadow-xl"
                            >
                                {getButtonText()}
                                {!isLoading && <ArrowRight className="w-4 h-4" />}
                            </button>

                            {message && (
                                <div className={`p-3 rounded-xl text-sm font-medium text-center ${message.includes("Success") || message.includes("Recovery") || message.includes("created") || message.includes("Check") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"}`}>
                                    {message}
                                </div>
                            )}
                        </form>

                        {/* Benefits */}
                        {mode === "signup" && (
                            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
                                <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    What you get:
                                </div>
                                <ul className="text-sm text-slate-600 space-y-1">
                                    <li>• Unlimited queue management</li>
                                    <li>• Real-time customer notifications</li>
                                    <li>• Analytics dashboard</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        By continuing, you agree to our <Link href="/terms" className="underline hover:text-slate-500 transition-colors">Terms of Service</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
