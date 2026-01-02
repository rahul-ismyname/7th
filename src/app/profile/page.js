"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, LogOut, ArrowLeft, CheckCircle2, AlertCircle, Camera, Bell, History, HelpCircle, ChevronRight, Mail, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import PushNotificationManager from "@/components/notifications/PushNotificationManager";

export default function ProfilePage() {
    const { user, signOut } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    // Profile State
    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || "");
    const [avatarUrl, setAvatarUrl] = useState(user?.user_metadata?.avatar_url || "");
    const [uploading, setUploading] = useState(false);

    // Mock Settings State
    const [notifications, setNotifications] = useState({
        email: true,
        push: true,
        marketing: false
    });

    const handleAvatarUpload = async (e) => {
        try {
            setUploading(true);

            if (!e.target.files || e.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = e.target.files[0];
            const fileExt = file.name.split('.').pop();
            const filePath = `${user?.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            if (data) {
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { avatar_url: data.publicUrl }
                });

                if (updateError) throw updateError;

                setAvatarUrl(data.publicUrl);
                setMessage({ type: 'success', text: "Profile picture updated!" });
            }

        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setUploading(false);
        }
    };

    // Password State
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const { error } = await supabase.auth.updateUser({
                data: { display_name: displayName }
            });

            if (error) throw error;
            setMessage({ type: 'success', text: "Profile updated successfully!" });
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const presetAvatars = [
        '/avatars/robot.png',
        '/avatars/cat.png',
        '/avatars/ninja.png',
    ];

    const handlePresetSelect = async (url) => {
        try {
            setLoading(true);
            const { error } = await supabase.auth.updateUser({
                data: { avatar_url: url }
            });

            if (error) throw error;

            setAvatarUrl(url);
            setMessage({ type: 'success', text: "Avatar updated!" });
        } catch (error) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
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
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleContactSupport = () => {
        navigator.clipboard.writeText("waitly2022@gmail.com");
        setMessage({ type: 'success', text: "Support email copied to clipboard!" });
        window.location.href = "mailto:waitly2022@gmail.com";
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
        <div className="min-h-screen bg-[#FDFCFD] font-sans text-slate-900 relative selection:bg-indigo-100">
            {/* Decorative Background for PC */}
            <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-indigo-50/50 to-transparent rounded-full blur-3xl opacity-60" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-rose-50/50 to-transparent rounded-full blur-3xl opacity-60" />
            </div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 md:h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Link>
                        <h1 className="font-black text-xl md:text-2xl text-slate-900 tracking-tight">Account Settings</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-4 md:p-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN - IDENTITY (Sticky on PC) */}
                    <div className="lg:col-span-4">
                        <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center sticky top-24">
                            <div className="relative w-32 h-32 mx-auto mb-6 group">
                                <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-4xl font-black overflow-hidden border-[6px] border-white shadow-2xl shadow-indigo-100 transition-transform group-hover:scale-105">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        (displayName?.[0] || user.email?.[0] || "U").toUpperCase()
                                    )}
                                </div>
                                <label className="absolute bottom-1 right-1 p-3 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-indigo-600 transition-all shadow-lg hover:rotate-12 active:scale-95">
                                    <Camera className="w-5 h-5" />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                {uploading && (
                                    <div className="absolute inset-0 bg-white/50 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <div className="animate-spin w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 mb-1">{displayName || "User"}</h2>
                            <p className="text-slate-500 font-medium mb-6 font-mono text-xs bg-slate-100 py-1 px-3 rounded-full inline-block">{user.email}</p>

                            {/* Presets */}
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Quick Change</p>
                            <div className="flex items-center justify-center gap-3 mb-8">
                                {presetAvatars.map((url, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePresetSelect(url)}
                                        disabled={loading}
                                        className="w-12 h-12 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform overflow-hidden focus:ring-4 ring-indigo-100"
                                    >
                                        <img src={url} alt="Preset" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={async () => {
                                    try {
                                        await signOut();
                                        router.push('/');
                                    } catch (e) {
                                        console.error("Sign out error:", e);
                                    }
                                }}
                                className="w-full py-4 text-rose-500 font-bold hover:bg-rose-50 rounded-2xl transition-colors flex items-center justify-center gap-2 group"
                            >
                                <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Sign Out
                            </button>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - SETTINGS content */}
                    <div className="lg:col-span-8 space-y-8">

                        {message && (
                            <div className={cn(
                                "p-4 rounded-2xl flex items-center gap-4 text-sm font-bold animate-in fade-in slide-in-from-top-4 shadow-sm",
                                message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                            )}>
                                <div className={cn("p-2 rounded-full", message.type === 'success' ? "bg-emerald-100" : "bg-rose-100")}>
                                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                {message.text}
                            </div>
                        )}

                        {/* Recent History (New Feature) */}
                        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
                                <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl">
                                    <History className="w-5 h-5" />
                                </div>
                                Recent Visits
                            </h3>
                            <div className="space-y-4">
                                {/* Mock Data */}
                                {[
                                    { name: "Joe's Coffee", date: "Today", status: "Completed" },
                                    { name: "Dr. Smith Clinic", date: "Yesterday", status: "Cancelled" },
                                    { name: "City Bank", date: "Dec 24", status: "Completed" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-default group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-slate-400 border border-slate-100 text-sm">
                                                {item.name[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{item.date}</p>
                                            </div>
                                        </div>
                                        <span className={cn("text-xs font-bold px-3 py-1 rounded-full", item.status === 'Completed' ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600")}>
                                            {item.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Notification Preferences (New Feature) */}
                        <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                                    <Bell className="w-5 h-5" />
                                </div>
                                Notifications
                            </h3>
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Email Alerts</p>
                                            <p className="text-xs text-slate-400 max-w-[200px] md:max-w-none">Receive queue updates and receipts via email.</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={notifications.email} onChange={() => setNotifications({ ...notifications, email: !notifications.email })} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-slate-50 rounded-lg text-slate-400">
                                            <Smartphone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">Push Notifications</p>
                                            <p className="text-xs text-slate-400 max-w-[200px] md:max-w-none">Get buzzed when it's your turn.</p>
                                        </div>
                                    </div>
                                    <PushNotificationManager />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Edit Profile Form */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 h-full">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
                                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl">
                                        <User className="w-5 h-5" />
                                    </div>
                                    Edit Details
                                </h3>
                                <form onSubmit={handleUpdateProfile} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Display Name</label>
                                        <input
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 ring-indigo-500/10 outline-none transition-all focus:bg-white focus:border-indigo-300"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                    <button
                                        disabled={loading}
                                        className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
                                    >
                                        {loading ? "Saving..." : "Save Changes"}
                                    </button>
                                </form>
                            </div>

                            {/* Change Password Form */}
                            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-slate-100 h-full">
                                <h3 className="text-lg font-bold mb-6 flex items-center gap-3 text-slate-900">
                                    <div className="p-2.5 bg-rose-100 text-rose-600 rounded-xl">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    Security
                                </h3>
                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">New Password</label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 ring-indigo-500/10 outline-none transition-all focus:bg-white focus:border-indigo-300"
                                            placeholder="At least 6 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-4 ring-indigo-500/10 outline-none transition-all focus:bg-white focus:border-indigo-300"
                                            placeholder="Repeat password"
                                        />
                                    </div>
                                    <button
                                        disabled={loading || !password}
                                        className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50 hover:border-slate-300"
                                    >
                                        Update Password
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Help Section */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[2rem] p-8 text-white relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h3 className="text-2xl font-black mb-2">Need Help?</h3>
                                    <p className="text-indigo-100 font-medium mb-1">Have an issue with a recent visit?</p>
                                    <p className="text-sm text-indigo-200 font-mono select-all">waitly2022@gmail.com</p>
                                </div>
                                <button
                                    onClick={handleContactSupport}
                                    className="px-6 py-3 bg-white text-indigo-600 font-bold rounded-xl shadow-lg hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2"
                                >
                                    <Mail className="w-5 h-5" /> Contact Support
                                </button>
                            </div>
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
