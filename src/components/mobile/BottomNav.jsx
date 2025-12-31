"use client";

import { Home, Map as MapIcon, Ticket, User } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export function BottomNav({ currentView, onViewChange, activeTicketsCount }) {
    const { user } = useAuth();

    // Define navigation items
    const navItems = [
        {
            id: "list",
            label: "Home",
            icon: Home,
            onClick: () => onViewChange("list")
        },
        {
            id: "map",
            label: "Map",
            icon: MapIcon,
            onClick: () => onViewChange("map")
        },
        {
            id: "tickets",
            label: "Tickets",
            icon: Ticket,
            onClick: () => onViewChange("tickets"),
            badge: activeTicketsCount > 0 ? activeTicketsCount : null
        },
        {
            id: "profile",
            label: "Profile",
            icon: User,
            href: "/profile" // Link instead of view change
        }
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-2 pb-safe md:hidden z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = currentView === item.id || (item.id === 'profile' && false); // Profile is a separate page
                    const Icon = item.icon;

                    // Common content for both button and link
                    const content = (
                        <div className="flex flex-col items-center gap-1 relative p-2">
                            <div className={cn(
                                "p-1.5 rounded-xl transition-all duration-300",
                                isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-400 group-hover:text-slate-600"
                            )}>
                                <Icon className={cn("w-6 h-6", isActive && "fill-current")} />

                                {item.badge && (
                                    <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white text-[10px] font-bold text-white flex items-center justify-center animate-in zoom-in">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className={cn(
                                "text-[10px] font-bold transition-colors",
                                isActive ? "text-indigo-600" : "text-slate-400"
                            )}>
                                {item.label}
                            </span>
                        </div>
                    );

                    if (item.href) {
                        return (
                            <Link key={item.id} href={item.href || '#'} className="group">
                                {content}
                            </Link>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            onClick={item.onClick}
                            className="group"
                        >
                            {content}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
