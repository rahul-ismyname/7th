"use client";

import { cn } from "@/lib/utils";
import { MapPin, Star, BadgeCheck, Activity, Landmark, Stethoscope, Utensils, Building2, Library, Store, Clock, Users, Zap } from "lucide-react";

const CATEGORY_ICONS = {
    Bank: Landmark,
    Clinic: Stethoscope,
    Restaurant: Utensils,
    Government: Building2,
    "Public Service": Library,
    default: Store
};

const CROWD_COLORS = {
    Low: "bg-emerald-100 text-emerald-700",
    Medium: "bg-amber-100 text-amber-700",
    High: "bg-rose-100 text-rose-700"
};

// Skeleton loader for places
export function PlaceListSkeleton({ count = 5 }) {
    return (
        <div className="flex flex-col gap-2 p-4 animate-in fade-in duration-300">
            {[...Array(count)].map((_, i) => (
                <div
                    key={i}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 animate-pulse"
                    style={{ animationDelay: `${i * 50}ms` }}
                >
                    <div className="w-12 h-12 rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-slate-200 rounded-lg w-3/4" />
                        <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                    </div>
                    <div className="w-12 h-6 bg-slate-100 rounded-lg" />
                </div>
            ))}
        </div>
    );
}

export function PlaceList({ places, onSelect, selectedId, isLoading }) {
    if (isLoading) {
        return <PlaceListSkeleton />;
    }

    return (
        <div className="flex flex-col gap-2 p-4">
            {places.map((place, index) => {
                const isActive = selectedId === place.id;
                const Icon = CATEGORY_ICONS[place.type] || CATEGORY_ICONS.default;
                const hasLiveQueue = place.queueLength > 0;
                const crowdColor = CROWD_COLORS[place.crowdLevel] || CROWD_COLORS.Medium;

                return (
                    <button
                        key={place.id}
                        onClick={() => onSelect(place.id)}
                        className={cn(
                            "flex items-center gap-3 p-3.5 rounded-2xl text-left group relative overflow-hidden",
                            "transition-all duration-150 ease-out", // Faster transitions
                            "motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2",
                            isActive
                                ? "bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200/50 scale-[1.02]"
                                : "bg-white hover:bg-slate-50 active:scale-[0.98] shadow-sm hover:shadow-md border border-slate-100/80"
                        )}
                        style={{
                            willChange: "transform, opacity",
                            animationDelay: `${index * 30}ms`,
                            animationFillMode: "both"
                        }}
                    >


                        {/* Icon */}
                        <div className={cn(
                            "flex items-center justify-center w-11 h-11 rounded-xl shrink-0 transition-all duration-150",
                            isActive
                                ? "bg-white/20 text-white"
                                : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500 group-hover:from-indigo-50 group-hover:to-violet-50 group-hover:text-indigo-600"
                        )}>
                            <Icon className="w-5 h-5" />
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className={cn(
                                "font-semibold text-[15px] truncate leading-tight",
                                isActive ? "text-white" : "text-slate-900"
                            )}>
                                {place.name}
                            </h3>
                            <div className={cn(
                                "flex items-center gap-1.5 mt-0.5",
                                isActive ? "text-indigo-200" : "text-slate-400"
                            )}>
                                <span className="text-xs font-medium truncate">{place.type}</span>
                                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                                <span className="text-xs font-medium flex items-center gap-1">
                                    <MapPin className="ml-0.5 w-3 h-3 opacity-70" />
                                    {place.distanceDisplay}
                                </span>
                            </div>
                        </div>

                        {/* Right Side: Wait Time */}
                        <div className="shrink-0 flex flex-col items-end gap-1">
                            <div className={cn(
                                "flex items-center gap-1 text-sm font-bold tabular-nums",
                                isActive ? "text-white" : (place.liveWaitTime > 30 ? "text-rose-600" : "text-slate-700")
                            )}>
                                <Zap className={cn(
                                    "w-3.5 h-3.5",
                                    place.liveWaitTime > 30 ? "text-rose-400" : "text-indigo-400"
                                )} />
                                {place.liveWaitTime}m
                            </div>
                        </div>
                    </button>
                );
            })}
        </div >
    );
}
