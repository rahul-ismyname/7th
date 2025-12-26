"use client";

import { Place } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MapPin, Star, BadgeCheck, Activity } from "lucide-react";

interface PlaceListProps {
    places: Place[];
    onSelect: (id: string) => void;
    selectedId?: string;
}

export function PlaceList({ places, onSelect, selectedId }: PlaceListProps) {
    return (
        <div className="flex flex-col gap-2 p-4 pb-24 overflow-y-auto h-full">
            <div className="flex items-center justify-between px-2 mb-2">
                <h2 className="text-lg font-bold tracking-tight text-slate-800">Nearby</h2>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{places.length} Places</span>
            </div>

            {places.map((place) => {
                const isActive = selectedId === place.id;

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
                        {/* Rating Circle */}
                        <div className={cn(
                            "flex flex-col items-center justify-center w-12 h-12 rounded-2xl shrink-0 font-black text-sm",
                            isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-900"
                        )}>
                            {place.rating}
                            <span className="text-[10px] items-center flex opacity-60"><Star className="w-2 h-2 mr-0.5" /></span>
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

                        {/* Status Badge */}
                        <div className="shrink-0">
                            {place.isApproved ? (
                                <div className={cn(
                                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide flex items-center gap-1.5",
                                    isActive ? "bg-white text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                    <BadgeCheck className="w-3 h-3" />
                                    Join
                                </div>
                            ) : (
                                <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    place.crowdLevel === 'High' ? "bg-rose-500" : "bg-amber-500"
                                )} />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
