"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { usePlaces, Ticket } from "@/context/PlacesContext";
import { supabase } from "@/lib/supabase";
import {
    LayoutDashboard,
    Plus,
    Megaphone,
    CheckCircle2,
    XCircle,
    Store,
    Clock,
    QrCode,
    ArrowLeft,
    Users,
    Sparkles,
    MapPin
} from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
});

export default function VendorPage() {
    const { user, vendorPlaces, addPlace, removePlace, updateTicketStatus, callNextTicket } = usePlaces();

    const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
    const [vendorTickets, setVendorTickets] = useState<Ticket[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [showQR, setShowQR] = useState(false);

    const [newPlace, setNewPlace] = useState<{ name: string, type: string, address: string, coordinates?: { lat: number, lng: number } }>({
        name: "", type: "", address: ""
    });

    // Local state for editing hours
    const [hours, setHours] = useState({ open: "09:00", close: "17:00" });
    const [isSavingHours, setIsSavingHours] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    const [greeting, setGreeting] = useState("Good morning");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Time-based greeting
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    const myPlaces = useMemo(() => vendorPlaces, [vendorPlaces]);

    // ... (existing effects)

    // Close mobile menu when a place is selected
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [selectedPlaceId, isCreating]);

    // ... (rest of logic)

    return (
        <div className="min-h-screen bg-white flex font-sans text-slate-900 overflow-hidden relative">
            {/* Mobile Drawer Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 md:hidden flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                        onClick={() => setMobileMenuOpen(false)}
                    />

                    {/* Drawer Content */}
                    <div className="relative w-3/4 max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <span className="font-bold text-lg">Menu</span>
                            <button onClick={() => setMobileMenuOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500">
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 flex flex-col gap-2 overflow-y-auto flex-1">
                            <button
                                onClick={() => { setIsCreating(true); setSelectedPlaceId(null); setMobileMenuOpen(false); }}
                                className="w-full py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold flex items-center justify-center gap-2 mb-4"
                            >
                                <Plus className="w-5 h-5" /> Add New Business
                            </button>

                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">Your Businesses</div>

                            {myPlaces.length === 0 && (
                                <p className="text-sm text-slate-400 italic px-2">No businesses yet.</p>
                            )}

                            {myPlaces.map(place => (
                                <button
                                    key={place.id}
                                    onClick={() => { setSelectedPlaceId(place.id); setIsCreating(false); setMobileMenuOpen(false); }}
                                    className={cn(
                                        "w-full text-left px-4 py-3 rounded-xl transition-all border",
                                        selectedPlaceId === place.id
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                            : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                                    )}
                                >
                                    <span className="font-bold block truncate">{place.name}</span>
                                    <span className={cn("text-xs opacity-80", selectedPlaceId === place.id ? "text-slate-300" : "text-slate-400")}>
                                        {place.isApproved ? '● Live' : '○ Pending'}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50">
                            <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                                <ArrowLeft className="w-4 h-4" /> Exit to App
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Modal */}
            {showQR && selectedPlaceId && (
                // ... (QR Modal Code preserved)
                <>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in print:hidden">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in-95">
                            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
                            {/* ... Content ... */}
                            <div className="mb-6">
                                <h2 className="text-2xl font-black text-slate-900 mb-1">{selectedPlace?.name}</h2>
                                <p className="text-slate-500 font-medium">Scan to join queue</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-inner inline-block mb-6">
                                <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}?place_id=${selectedPlaceId}`} size={200} />
                            </div>
                            <button onClick={() => window.print()} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                <QrCode className="w-5 h-5" /> Print Poster
                            </button>
                        </div>
                    </div>
                    <div id="printable-qr" className="hidden">
                        {/* Printable QR Content */}
                        <div className="flex flex-col items-center justify-center h-full text-center border-8 border-slate-900 p-12 m-4 rounded-[40px]">
                            <h1 className="text-6xl font-black text-slate-900 mb-4">{selectedPlace?.name}</h1>
                            <p className="text-3xl text-slate-500 font-bold mb-12">Join the Queue</p>
                            <QRCode value={`${typeof window !== 'undefined' ? window.location.origin : ''}?place_id=${selectedPlaceId}`} size={600} className="w-[80vw] max-w-[600px] h-auto mb-12" />
                            <p className="text-xl font-medium text-slate-400">Scan with your phone camera</p>
                            <div className="mt-8 flex items-center gap-2 text-slate-300 font-bold text-lg">
                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">W</div>
                                Powered by Waitly
                            </div>
                        </div>
                    </div>
                </>
            )}

            <style jsx global>{`
                @media print {
                    @page { margin: 0; }
                    body { visibility: hidden; }
                    #printable-qr {
                        visibility: visible;
                        display: flex !important;
                        position: fixed;
                        inset: 0;
                        z-index: 9999;
                        background: white;
                        width: 100vw;
                        height: 100vh;
                        align-items: center;
                        justify-content: center;
                    }
                    #printable-qr * { visibility: visible; }
                }
            `}</style>

            {/* Sidebar (Desktop) */}
            <div className="w-72 bg-slate-50/50 border-r border-slate-100 hidden md:flex flex-col">
                <div className="p-6">
                    <div className="flex items-center gap-3 text-slate-900 mb-8">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 rotate-3">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-tight">Vendor<br /><span className="text-slate-400 font-medium text-xs">Portal</span></h1>
                        </div>
                    </div>

                    <div className="mb-6 px-1">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{greeting}! 👋</h2>
                        <p className="text-xs text-slate-500 font-medium">Ready to serve today?</p>
                    </div>

                    <button
                        onClick={() => { setIsCreating(true); setSelectedPlaceId(null); }}
                        className="w-full py-3.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
                    >
                        <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" /> Add Business
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 space-y-1">
                    <div className="px-2 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">My Businesses</div>

                    {myPlaces.length === 0 && !isCreating && (
                        <div className="px-3 py-12 text-center bg-white rounded-3xl border border-slate-100 border-dashed mx-2">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Store className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-bold text-slate-500 mb-1">No businesses yet</p>
                            <p className="text-xs text-slate-400 max-w-[150px] mx-auto">Add your first location to start queuing.</p>
                        </div>
                    )}

                    {myPlaces.map(place => (
                        <button
                            key={place.id}
                            onClick={() => { setSelectedPlaceId(place.id); setIsCreating(false); }}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl transition-all border",
                                selectedPlaceId === place.id
                                    ? 'bg-white border-slate-200 shadow-sm'
                                    : 'border-transparent hover:bg-slate-100 text-slate-500'
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm",
                                    place.isApproved ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                )}>
                                    {place.name[0]}
                                </div>
                                <div className="min-w-0">
                                    <span className={cn("font-bold block truncate", selectedPlaceId === place.id ? "text-slate-900" : "text-slate-600")}>{place.name}</span>
                                    <span className="text-xs text-slate-400">{place.isApproved ? '● Live' : '○ Pending'}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors px-2">
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white shrink-0 z-20 shadow-md">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
                            {/* Hamburger Icon */}
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <span className="font-bold text-lg">Dashboard</span>
                    </div>
                </div>

                {isCreating ? (
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto flex justify-center">
                        <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-sm h-fit border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-4 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl">
                                    <Sparkles className="w-8 h-8 text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900">Register Business</h2>
                                    <p className="text-slate-500">Add your business to start managing queues</p>
                                </div>
                            </div>

                            <form onSubmit={handleCreateBusiness} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Business Name</label>
                                        <input
                                            value={newPlace.name}
                                            onChange={e => setNewPlace({ ...newPlace, name: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-xl font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                            placeholder="e.g. Joe's Coffee"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                                        <select
                                            value={newPlace.type}
                                            onChange={e => setNewPlace({ ...newPlace, type: e.target.value })}
                                            className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-xl font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                            required
                                        >
                                            <option value="">Select Type...</option>
                                            <option value="Restaurant">Restaurant</option>
                                            <option value="Cafe">Cafe</option>
                                            <option value="Clinic">Clinic</option>
                                            <option value="Bank">Bank</option>
                                            <option value="Salon">Salon</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-bold text-slate-700">Location</label>
                                        <button
                                            type="button"
                                            onClick={handleGetLocation}
                                            disabled={isLocating}
                                            className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
                                        >
                                            {isLocating ? (
                                                <>
                                                    <div className="w-3 h-3 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" />
                                                    Locating...
                                                </>
                                            ) : (
                                                <>
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    Use My Current Location
                                                </>
                                            )}
                                        </button>
                                    </div>
                                    <div className="h-64 rounded-xl overflow-hidden border-2 border-slate-100 mb-3 relative">
                                        <LocationPicker
                                            onLocationSelect={(lat, lng) => setNewPlace(prev => ({ ...prev, coordinates: { lat, lng } }))}
                                            coordinates={newPlace.coordinates}
                                        />
                                        {!newPlace.coordinates && (
                                            <div className="absolute inset-0 bg-slate-900/5 flex items-center justify-center pointer-events-none">
                                                <span className="bg-white px-4 py-2 rounded-xl text-sm font-bold shadow-md">📍 Click map to set location</span>
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        value={newPlace.address}
                                        onChange={e => setNewPlace({ ...newPlace, address: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-transparent rounded-xl font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                        placeholder="Full street address"
                                        required
                                    />
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-4 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                                        Cancel
                                    </button>
                                    <button className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]">
                                        Register Business
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : selectedPlaceId && selectedPlace ? (
                    <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-white">
                        <div className="max-w-4xl mx-auto">
                            {/* Header */}
                            <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-slate-100 pb-8">
                                <div>
                                    <div className="flex items-center gap-4 mb-2">
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{selectedPlace.name}</h1>
                                        <span className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-full border",
                                            selectedPlace.isApproved
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {selectedPlace.isApproved ? '● Live' : '○ Pending'}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-lg">{activeQueue.length} tickets in queue • ~{activeQueue.length * 5} min wait</p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-slate-400 font-medium">Business ID:</span>
                                        <code
                                            className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-600 cursor-pointer hover:bg-indigo-100 hover:text-indigo-600 transition-colors select-all"
                                            onClick={() => {
                                                navigator.clipboard.writeText(selectedPlaceId);
                                                alert('Business ID copied!');
                                            }}
                                            title="Click to copy"
                                        >
                                            {selectedPlaceId}
                                        </code>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => setShowQR(true)} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all">
                                        <QrCode className="w-5 h-5" />
                                    </button>
                                    <button onClick={handleDeleteBusiness} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </header>

                            {/* Working Hours Settings */}
                            <div className="mb-12">
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4" /> Operating Hours
                                </h3>
                                <div className="flex items-end gap-4 p-1">
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">Opening Time</label>
                                        <input
                                            type="time"
                                            value={hours.open}
                                            onChange={e => setHours(prev => ({ ...prev, open: e.target.value }))}
                                            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-xs font-bold text-slate-500 mb-2 block">Closing Time</label>
                                        <input
                                            type="time"
                                            value={hours.close}
                                            onChange={e => setHours(prev => ({ ...prev, close: e.target.value }))}
                                            className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveHours}
                                        disabled={isSavingHours}
                                        className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50"
                                    >
                                        {isSavingHours ? "..." : "Save"}
                                    </button>
                                </div>
                            </div>

                            {!selectedPlace.isApproved && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
                                    <Clock className="w-5 h-5 shrink-0" />
                                    <p>Your business is <strong>hidden from the map</strong> pending admin approval. You can still test queues internally.</p>
                                </div>
                            )}

                            {/* Current Serving Card */}
                            <div className="bg-slate-900 rounded-[2.5rem] p-10 text-center mb-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                                    <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500 blur-[100px] rounded-full" />
                                    <div className="absolute bottom-[-50%] right-[-50%] w-full h-full bg-fuchsia-500 blur-[100px] rounded-full" />
                                </div>

                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 relative z-10">Now Serving</p>
                                <div className="text-8xl md:text-9xl font-black text-white mb-8 tracking-tighter relative z-10">
                                    {currentlyServing.length > 0 ? currentlyServing[0].tokenNumber : "--"}
                                </div>

                                {currentlyServing.length > 0 && (
                                    <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto relative z-10">
                                        <button
                                            onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'completed')}
                                            className="py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-6 h-6" /> Done
                                        </button>
                                        <button
                                            onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'cancelled')}
                                            className="py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                                        >
                                            <XCircle className="w-5 h-5" /> No Show
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Call Next Button */}
                            <button
                                onClick={onCallNext}
                                disabled={!nextTicket}
                                className="w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-3xl font-bold text-2xl shadow-2xl shadow-indigo-300 transition-all active:scale-[0.98] flex items-center justify-center gap-4"
                            >
                                {nextTicket ? (
                                    <>
                                        Call {nextTicket.tokenNumber}
                                        <Megaphone className="w-7 h-7" />
                                    </>
                                ) : (
                                    <span className="text-lg">Queue Empty</span>
                                )}
                            </button>

                            {/* Queue List */}
                            <div className="mt-6 bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <span className="font-bold text-slate-700">Waiting Queue</span>
                                    <span className="text-sm text-slate-400">{activeQueue.length} people</span>
                                </div>
                                {activeQueue.length === 0 ? (
                                    <div className="p-8 text-center text-slate-400">
                                        <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                        <p>No one in queue yet</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-50">
                                        {activeQueue.slice(0, 10).map((ticket, i) => (
                                            <div key={ticket.ticketId} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-sm">
                                                        {i + 1}
                                                    </span>
                                                    <span className="font-bold text-slate-800">{ticket.tokenNumber}</span>
                                                </div>
                                                <span className="text-sm text-slate-400">~{(i + 1) * 5}m</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                        <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center mb-6 rotate-6 animate-in zoom-in duration-500 shadow-xl shadow-indigo-100">
                            <LayoutDashboard className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Welcome to your Dashboard</h2>
                        <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
                            Select a business from the sidebar to manage its queue, or create a new one to get started.
                        </p>
                        <button
                            onClick={() => { setIsCreating(true); setSelectedPlaceId(null); }}
                            className="px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-black transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl hover:-translate-y-1"
                        >
                            <Plus className="w-5 h-5" /> Create New Business
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
