"use client";

import { cn } from "@/lib/utils";
import { MapPin, Star, BadgeCheck, Activity, Landmark, Stethoscope, Utensils, Building2, Library, Store, Clock } from "lucide-react";

const CATEGORY_ICONS = {
    Bank: Landmark,
    Clinic: Stethoscope,
    Restaurant: Utensils,
    Government: Building2,
    "Public Service": Library,
    default: Store
};

export function PlaceList({ places, onSelect, selectedId }) {
    return (
        <div className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-800">Nearby</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{places.length} Places</span>
            </div>

            {places.map((place) => {
                const isActive = selectedId === place.id;

                const Icon = CATEGORY_ICONS[place.type] || CATEGORY_ICONS.default;

                return (
                    <button
                        key={place.id}
                        onClick={() => onSelect(place.id)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-3xl text-left transition-all duration-300 group",
                            isActive
                                ? "bg-indigo-600 shadow-xl shadow-indigo-200 scale-[1.02]"
                                : "bg-white hover:bg-slate-50 hover:scale-[1.01] shadow-sm hover:shadow-md border border-slate-100"
                        )}
                        style={{ willChange: "transform" }}
                    >
                        {/* Icon Square */}
                        <div className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-2xl shrink-0 font-black text-sm transition-colors",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                        )}>
                            <Icon className="w-6 h-6" />
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 min-w-0">
                            <h3 className={cn("font-bold text-base truncate", isActive ? "text-white" : "text-slate-900")}>
                                {place.name}
                            </h3>
                            <p className={cn("text-xs font-medium truncate flex items-center gap-2", isActive ? "text-indigo-200" : "text-slate-400")}>
                                {place.type}
                                <span className={cn("w-1 h-1 rounded-full", isActive ? "bg-indigo-400" : "bg-slate-300")} />
                                {place.distance}
                            </p>
                        </div>

                        {/* Status / Time */}
                        <div className="shrink-0 text-right">
                            <div className={cn(
                                "text-sm font-bold flex items-center justify-end gap-1",
                                isActive ? "text-white" : "text-slate-600"
                            )}>
                                <Clock className="w-3.5 h-3.5 opacity-50" />
                                {place.liveWaitTime} m
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
