"use client";

import React, { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Compass, KeyRound, Store, Sparkles, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { signupUser, requestPasswordReset } from "@/actions/auth";
import Logo from "@/components/Logo";

function LoginContent() {
    const [mode, setMode] = useState("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextPath = searchParams.get('next');
    const role = searchParams.get('role');

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

                const result = await signupUser(formData);

                if (result.error) {
                    setMessage(result.error);
                } else {
                    setMessage(result.message || "Account created! Check your email.");
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
                    setMessage("Success! Redirecting...");

                    const isVendor = nextPath?.includes('/vendor') || role === 'vendor';
                    localStorage.setItem("waitly_mode", isVendor ? "vendor" : "user");

                    router.push(nextPath || "/");
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
        if (mode === "signup") return "Create Account";
        return "Welcome Back";
    };

    const getSubtitle = () => {
        if (mode === "forgot") return "We'll send you a recovery link";
        if (mode === "signup") return "Join the queue revolution";
        return "Sign in to continue";
    };

    const getButtonText = () => {
        if (isLoading) return <Loader2 className="w-5 h-5 animate-spin" />;
        if (mode === "forgot") return "Send Reset Link";
        if (mode === "signup") return "Create Account";
        return "Sign In";
    };

    return (
        <div className="h-[100dvh] w-full flex bg-slate-50 overflow-hidden">
            {/* Left Panel - Form */}
            <div className="w-full lg:w-[480px] xl:w-[520px] flex flex-col bg-white border-r border-slate-100 relative">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <Link href="/" className="flex items-center gap-2 group">
                        <Logo className="w-8 h-8 text-indigo-600" />
                        <span className="font-black text-xl text-slate-900 tracking-tight">Waitly</span>
                    </Link>
                    <Link
                        href="/vendor/login"
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-600 text-sm font-medium transition-colors"
                    >
                        <Store className="w-4 h-4" />
                        <span className="hidden sm:inline">Business</span>
                    </Link>
                </div>

                {/* Form Content */}
                <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-12">
                    <div className="max-w-sm mx-auto w-full">
                        {/* Icon & Title */}
                        <div className="mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-indigo-200/50">
                                {mode === "forgot" ? <KeyRound className="w-6 h-6 text-white" /> : <Compass className="w-6 h-6 text-white" />}
                            </div>
                            <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">
                                {getTitle()}
                            </h1>
                            <p className="text-slate-500 font-medium">
                                {getSubtitle()}
                            </p>
                        </div>

                        {/* Google OAuth */}
                        {mode !== "forgot" && (
                            <>
                                <button
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const isVendor = nextPath?.includes('/vendor') || role === 'vendor';
                                        const finalNext = nextPath || (isVendor ? '/vendor' : '/');

                                        // Set cookie validation to ensure correct redirect
                                        document.cookie = `waitly_next=${finalNext}; path=/; max-age=600`;
                                        localStorage.setItem("waitly_mode", "user");

                                        const { error } = await supabase.auth.signInWithOAuth({
                                            provider: 'google',
                                            options: {
                                                redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(finalNext)}`,
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
                                        <span className="bg-white px-3 text-slate-400 font-medium">or</span>
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
                                    placeholder="Email address"
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
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 text-center border-t border-slate-100">
                    <p className="text-xs text-slate-400">
                        By continuing, you agree to our <Link href="/terms" className="underline hover:text-slate-500 transition-colors">Terms of Service</Link>
                    </p>
                </div>
            </div>

            {/* Right Panel - Visual */}
            <div className="hidden lg:flex flex-1 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative items-center justify-center overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 opacity-30">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl" />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center text-white px-12 max-w-lg">
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                            <Sparkles className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black tracking-tight mb-4">
                            Skip the line,<br />save your time
                        </h2>
                        <p className="text-white/80 text-lg font-medium">
                            Join virtual queues from anywhere. Get real-time updates and never wait in line again.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-black">500+</div>
                            <div className="text-xs text-white/70 font-medium">Businesses</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-black">10K+</div>
                            <div className="text-xs text-white/70 font-medium">Users</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                            <div className="text-2xl font-black">4.9★</div>
                            <div className="text-xs text-white/70 font-medium">Rating</div>
                        </div>
                    </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-20 right-20 w-4 h-4 bg-yellow-300 rounded-full animate-pulse" />
                <div className="absolute bottom-32 left-20 w-3 h-3 bg-pink-300 rounded-full animate-pulse delay-150" />
                <div className="absolute top-1/2 right-32 w-2 h-2 bg-white rounded-full animate-pulse delay-300" />
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <React.Suspense fallback={
            <div className="h-[100dvh] w-full flex items-center justify-center bg-slate-50">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        }>
            <LoginContent />
        </React.Suspense>
    );
}
