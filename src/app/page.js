"use client";

import { useState, useEffect, Suspense } from "react";
import { usePlaces } from "@/context/PlacesContext";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import dynamic from "next/dynamic";

const OSMMap = dynamic(() => import("@/components/map/OSMMap"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-4 border-slate-600 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading Map...</span>
        </div>
    </div>,
});
import { PlaceList } from "@/components/places/PlaceList";
import { PlaceDetails } from "@/components/places/PlaceDetails";
import { cn } from "@/lib/utils";
import { UserTickets } from "@/components/user/UserTickets";
import { Search, Ticket, Store, MapPin, Clock, Users, Sparkles, ChevronRight, Bell } from "lucide-react";

function HomeContent() {
    const { places, activeTickets, user } = usePlaces();
    const [selectedPlaceId, setSelectedPlaceId] = useState(undefined);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState("places");
    const searchParams = useSearchParams();
    const [userLocation, setUserLocation] = useState(null);
    const [searchCenter, setSearchCenter] = useState(null); // New: Track where we are searching
    const [mobileView, setMobileView] = useState("list");

    // Auto-switch to list/details if a place is selected from map
    useEffect(() => {
        if (selectedPlaceId) {
            setMobileView("list");
        }
    }, [selectedPlaceId]);

    // Get User Location on Mount
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(loc);
                    setSearchCenter(loc); // Initial search center = user location
                },
                (error) => {
                    console.warn("Location access denied or error:", error);
                    const fallback = { lat: 28.6328, lng: 77.2197 };
                    setUserLocation(fallback);
                    setSearchCenter(fallback);
                }
            );
        } else {
            const fallback = { lat: 28.6328, lng: 77.2197 };
            setUserLocation(fallback);
            setSearchCenter(fallback);
        }
    }, []);

    // Distance Calculator (Haversine Formula) in km
    function getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    const filteredPlaces = places.filter(place => {
        // 1. Search Mode: Show everything that matches query
        if (searchQuery) {
            return (
                place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.address.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // 2. Nearby Mode (No Search): Filter by Distance from SEARCH CENTER (Max 4km)
        if (searchCenter) {
            const dist = getDistance(searchCenter.lat, searchCenter.lng, place.coordinates.lat, place.coordinates.lng);
            return dist <= 4.0; // 4 km radius from where the user is LOOKING
        }

        return true; // Fallback if no location yet
    }).slice(0, 20); // Always cap at 20 for performance

    const selectedPlace = places.find(p => p.id === selectedPlaceId);

    // Stats
    const avgWaitTime = places.length > 0 ? Math.round(places.reduce((acc, p) => acc + (p.liveWaitTime || 0), 0) / places.length) : 0;

    return (
        <main className="flex h-screen w-full bg-slate-50 overflow-hidden relative">
            {/* Left Sidebar Panel */}
            <aside className={cn(
                "flex flex-col w-full md:w-[420px] lg:w-[480px] bg-white border-r border-slate-100 shadow-xl z-20 shrink-0 transition-transform duration-300 absolute md:relative h-full",
                mobileView === "map" ? "translate-y-full md:translate-y-0" : "translate-y-0"
            )}>
                {/* Enhanced Header */}
                <header className="px-5 pt-5 pb-4 shrink-0 bg-gradient-to-b from-white to-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        {/* Brand */}
                        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => { setViewMode("places"); setSelectedPlaceId(undefined); }}>
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">
                                W
                            </div>
                            <div className="flex flex-col">
                                <span className="font-black text-2xl tracking-tight text-slate-900 leading-none">Waitly</span>
                                <span className="text-xs font-medium text-slate-400 leading-none mt-0.5">Skip the line, save your time</span>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {user ? (
                                <>
                                    <button
                                        onClick={() => setViewMode(viewMode === "tickets" ? "places" : "tickets")}
                                        className={cn(
                                            "relative p-2.5 rounded-xl transition-all duration-200",
                                            viewMode === "tickets"
                                                ? "bg-indigo-100 text-indigo-600"
                                                : "bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                                        )}
                                        title="My Tickets"
                                    >
                                        <Ticket className="w-5 h-5" />
                                        {activeTickets.length > 0 && (
                                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full border-2 border-white text-[10px] font-bold text-white flex items-center justify-center">
                                                {activeTickets.length}
                                            </span>
                                        )}
                                    </button>
                                    <Link
                                        href="/profile"
                                        className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
                                    >
                                        {user.user_metadata?.avatar_url ? (
                                            <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
                                        ) : (
                                            (user.email?.[0] || 'U').toUpperCase()
                                        )}
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-5 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all"
                                >
                                    Get Started
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                            )}
                        </div>
                    </div>


                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-hidden relative">
                    <div className="flex-1 overflow-hidden relative">
                        {/* Mobile: Details replaces List */}
                        <div className={cn(
                            "absolute inset-0 z-20 bg-white h-full transition-transform duration-300 md:hidden",
                            selectedPlace ? "translate-x-0" : "translate-x-full"
                        )}>
                            {selectedPlace && (
                                <PlaceDetails
                                    place={selectedPlace}
                                    onBack={() => setSelectedPlaceId(undefined)}
                                />
                            )}
                        </div>

                        {/* Main Content (Tickets or Places List) */}
                        {viewMode === "tickets" ? (
                            <UserTickets onSelectPlace={(id) => { setSelectedPlaceId(id); setViewMode("places"); }} />
                        ) : (
                            <div className="h-full flex flex-col">
                                {/* Search Bar */}
                                <div className="px-5 py-3 shrink-0">
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search places..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border-2 border-transparent rounded-2xl text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                {/* List Content */}
                                <div className="flex-1 overflow-y-auto">
                                    {!user && places.length > 0 && !searchQuery && (
                                        <div className="mx-5 mb-4 p-4 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl text-white relative overflow-hidden shrink-0">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                            <div className="relative">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Sparkles className="w-5 h-5" />
                                                    <span className="font-bold">New here?</span>
                                                </div>
                                                <p className="text-sm text-white/90 mb-3">Join queues remotely!</p>
                                                <Link href="/login" className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-indigo-50 transition-colors">
                                                    Sign Up
                                                </Link>
                                            </div>
                                        </div>
                                    )}

                                    <div className="px-5 pb-2 flex items-center justify-between shrink-0">
                                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                            {searchQuery ? "Results" : "Nearby"}
                                        </h2>
                                        <span className="text-xs font-medium text-slate-400">{filteredPlaces.length} found</span>
                                    </div>

                                    {filteredPlaces.length > 0 ? (
                                        <PlaceList
                                            places={filteredPlaces}
                                            onSelect={setSelectedPlaceId}
                                            selectedId={selectedPlaceId}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-8 text-center opacity-50">
                                            <Store className="w-12 h-12 mb-2 text-slate-300" />
                                            <p>No places found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </aside>

            {/* Desktop: Details Slide-out Panel (Next to Sidebar) */}
            <div className={cn(
                "hidden md:block absolute top-4 left-[440px] lg:left-[500px] w-[400px] h-[calc(100vh-2rem)] z-20 transition-all duration-300 ease-in-out",
                selectedPlace ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
            )}>
                {selectedPlace && (
                    <div className="w-full h-full bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden relative">
                        <PlaceDetails
                            place={selectedPlace}
                            onBack={() => setSelectedPlaceId(undefined)}
                        />
                    </div>
                )}
            </div>

            {/* Main Map Area */}
            <section className="flex-1 relative w-full h-full bg-slate-900">
                <OSMMap
                    places={filteredPlaces}
                    selectedPlaceId={selectedPlaceId}
                    onSelectPlace={setSelectedPlaceId}
                    onMapMoveEnd={(lat, lng) => setSearchCenter({ lat, lng })}
                />
                {/* Overlay gradient for better integration */}
                <div className="absolute inset-y-0 left-0 pointer-events-none bg-gradient-to-r from-white/20 to-transparent w-16 z-10 hidden md:block" />

                {/* Mobile View Toggle */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 md:hidden">
                    <div className="bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-xl flex gap-1">
                        <button
                            onClick={() => setMobileView("list")}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-sm transition-all",
                                mobileView === "list"
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            List
                        </button>
                        <button
                            onClick={() => setMobileView("map")}
                            className={cn(
                                "px-6 py-3 rounded-full font-bold text-sm transition-all",
                                mobileView === "map"
                                    ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md"
                                    : "text-slate-600 hover:bg-slate-100"
                            )}
                        >
                            Map
                        </button>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default function Home() {
    return (
        <Suspense fallback={
            <div className="flex h-screen items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl animate-pulse">
                        W
                    </div>
                    <div className="text-slate-500 font-medium">Loading Waitly...</div>
                </div>
            </div>
        }>
            <HomeContent />
        </Suspense>
    );
}
