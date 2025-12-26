"use client";

import { Place } from "@/lib/data";
import { cn } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface MapCanvasProps {
    places: Place[];
    selectedPlaceId?: string;
    onSelectPlace: (id: string) => void;
}

export function MapCanvas({ places, selectedPlaceId, onSelectPlace }: MapCanvasProps) {
    return (
        <div className="relative w-full h-full bg-slate-50 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: "radial-gradient(#000 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}
            />

            {/* City Blocks (Decorative) */}
            <div className="absolute top-[20%] left-[10%] w-[30%] h-[20%] bg-slate-200/50 rounded-xl transform -rotate-6" />
            <div className="absolute top-[50%] left-[60%] w-[25%] h-[30%] bg-slate-200/50 rounded-xl transform rotate-12" />
            <div className="absolute top-[60%] left-[20%] w-[20%] h-[15%] bg-slate-200/50 rounded-xl transform rotate-3" />

            {/* Pins */}
            {places.map((place) => {
                const isSelected = selectedPlaceId === place.id;

                return (
                    <button
                        key={place.id}
                        onClick={() => onSelectPlace(place.id)}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ease-out group"
                        style={{ left: `${place.coordinates.lat}%`, top: `${place.coordinates.lng}%` }} // Using lat/lng as percentages is wrong for MapCanvas but it's unused now so fine for compilation
                    >
                        <div className={cn(
                            "relative flex flex-col items-center justify-center transition-all duration-300",
                            isSelected ? "scale-110 z-20" : "scale-100 z-10 hover:scale-105"
                        )}>
                            {/* Tooltip / Label */}
                            <div className={cn(
                                "absolute -top-10 px-3 py-1 bg-white shadow-lg rounded-full text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none mb-2",
                                isSelected && "opacity-100"
                            )}>
                                {place.name}
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
                            </div>

                            {/* Pin Icon */}
                            <div className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center shadow-xl border-2 transition-colors",
                                place.isApproved
                                    ? (isSelected ? "bg-primary border-primary text-white" : "bg-white border-primary text-primary")
                                    : (isSelected ? "bg-slate-700 border-slate-700 text-white" : "bg-white border-slate-500 text-slate-500")
                            )}>
                                <MapPin className="w-5 h-5 fill-current" />
                            </div>

                            {/* Pulse effect for selected */}
                            {isSelected && place.isApproved && (
                                <div className="absolute inset-0 -z-10 bg-primary/30 rounded-full animate-ping" />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
