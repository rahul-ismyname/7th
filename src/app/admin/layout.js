"use client";

import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, LayoutDashboard, FileText, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const menuItems = [
        {
            label: "Registry",
            icon: LayoutDashboard,
            href: "/admin",
            active: pathname === "/admin"
        },
        {
            label: "Claims",
            icon: FileText,
            href: "/admin/claims",
            active: pathname === "/admin/claims"
        },
        // Placeholder for future settings
        // {
        //     label: "Settings",
        //     icon: Settings,
        //     href: "/admin/settings",
        //     active: pathname === "/admin/settings"
        // }
    ];

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-slate-900 text-white flex-shrink-0 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <ShieldCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tight">Waitly</h1>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Admin Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <div className="px-2 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        Menu
                    </div>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm group",
                                item.active
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/20"
                                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                            )}
                        >
                            <item.icon className={cn("w-5 h-5", item.active ? "text-indigo-200" : "text-slate-500 group-hover:text-white")} />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="bg-slate-800/50 rounded-2xl p-4 mb-3">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                                {user?.email?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white truncate">{user?.email}</p>
                                <p className="text-xs text-slate-400">Super Admin</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={signOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                    <Link
                        href="/"
                        className="flex items-center gap-2 w-full px-4 py-2 mt-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all text-xs font-bold uppercase tracking-wider"
                    >
                        Exit to App
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-x-hidden">
                {/* Mobile Header (Visible only on small screens) */}
                <div className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-6 h-6 text-indigo-400" />
                        <span className="font-bold">Waitly Admin</span>
                    </div>
                    {/* Mobile menu toggle could go here */}
                </div>

                {children}
            </main>
        </div>
    );
}
