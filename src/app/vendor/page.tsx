"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
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
    Sparkles
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

    const myPlaces = vendorPlaces;

    useEffect(() => {
        if (!selectedPlaceId) return;

        const fetchTickets = async () => {
            const { data } = await supabase
                .from('tickets')
                .select('*')
                .eq('place_id', selectedPlaceId)
                .order('created_at', { ascending: true });

            if (data) {
                const mapped: Ticket[] = data.map((t: any) => ({
                    placeId: t.place_id,
                    ticketId: t.id,
                    tokenNumber: t.token_number,
                    estimatedWait: t.estimated_wait,
                    timestamp: new Date(t.created_at).getTime(),
                    status: t.status
                }));
                setVendorTickets(mapped);
            }
        };

        fetchTickets();

        const channel = supabase
            .channel(`vendor_tickets_${selectedPlaceId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tickets',
                filter: `place_id=eq.${selectedPlaceId}`
            }, () => fetchTickets())
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [selectedPlaceId]);

    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center bg-white rounded-3xl p-10 shadow-xl max-w-sm">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Store className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Vendor Portal</h1>
                    <p className="text-slate-500 mb-6">Log in to manage your business queues</p>
                    <Link href="/login" className="block w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold hover:shadow-lg transition-all">
                        Log In to Continue
                    </Link>
                </div>
            </div>
        );
    }

    const handleCreateBusiness = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlace.coordinates) {
            alert("Please select a location on the map.");
            return;
        }
        addPlace({
            id: "",
            name: newPlace.name,
            type: newPlace.type,
            address: newPlace.address,
            rating: 5.0,
            isApproved: false,
            distance: "0 km",
            liveWaitTime: 0,
            crowdLevel: 'Low',
            queueLength: 0,
            coordinates: newPlace.coordinates
        });
        setIsCreating(false);
        setNewPlace({ name: "", type: "", address: "" });
    };

    const [deleteLoading, setDeleteLoading] = useState(false);

    const handleDeleteBusiness = async () => {
        if (!selectedPlaceId) return;
        const place = myPlaces.find(p => p.id === selectedPlaceId);
        if (!place) return;

        // If NOT approved, allow direct deletion
        if (!place.isApproved) {
            if (confirm("Delete this unapproved business?")) {
                await removePlace(selectedPlaceId);
                setSelectedPlaceId(null);
            }
            return;
        }

        // If approved, require email confirmation
        if (!user?.email) {
            alert("Unable to verify your email. Please try again.");
            return;
        }

        if (!confirm("This is an approved business. A confirmation email will be sent to verify deletion. Continue?")) {
            return;
        }

        setDeleteLoading(true);

        // Import dynamically to avoid issues
        const { requestBusinessDeletion } = await import("@/actions/business");
        const result = await requestBusinessDeletion(selectedPlaceId, user.email, place.name);

        setDeleteLoading(false);

        if (result.success) {
            alert("📧 Confirmation email sent! Check your inbox and click the link to confirm deletion.");
        } else {
            alert("Failed to send confirmation email. Please try again.");
        }
    };

    const activeQueue = vendorTickets.filter(t => t.status === 'waiting');
    const currentlyServing = vendorTickets.filter(t => t.status === 'serving');
    const nextTicket = activeQueue[0];

    const onCallNext = async () => {
        if (!nextTicket) return;
        for (const t of currentlyServing) {
            await updateTicketStatus(t.ticketId, 'completed');
        }
        await updateTicketStatus(nextTicket.ticketId, 'serving');
        await callNextTicket(selectedPlaceId!, nextTicket.tokenNumber);
    };

    const selectedPlace = myPlaces.find(p => p.id === selectedPlaceId);

    return (
        <div className="min-h-screen bg-slate-100 flex font-sans text-slate-900">
            {/* QR Modal */}
            {showQR && selectedPlaceId && (
                <>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in print:hidden">
                        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in-95">
                            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                                <XCircle className="w-6 h-6" />
                            </button>
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

            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col">
                <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-600 to-violet-600">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                            <LayoutDashboard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold text-white text-lg">Vendor Portal</h1>
                            <p className="text-xs text-white/70">Manage your queues</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    <button
                        onClick={() => { setIsCreating(true); setSelectedPlaceId(null); }}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 mb-4"
                    >
                        <Plus className="w-5 h-5" /> Add Business
                    </button>

                    <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">My Businesses</div>

                    {myPlaces.length === 0 && !isCreating && (
                        <div className="px-3 py-8 text-center">
                            <Store className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                            <p className="text-sm text-slate-400">No businesses yet</p>
                        </div>
                    )}

                    {myPlaces.map(place => (
                        <button
                            key={place.id}
                            onClick={() => { setSelectedPlaceId(place.id); setIsCreating(false); }}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl transition-all",
                                selectedPlaceId === place.id ? 'bg-indigo-50 border-2 border-indigo-200' : 'hover:bg-slate-50 border-2 border-transparent'
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
                                    <span className="font-bold text-slate-800 block truncate">{place.name}</span>
                                    <span className="text-xs text-slate-400">{place.isApproved ? '● Live' : '○ Pending'}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                    <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Back to App
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex justify-between items-center text-white">
                    <span className="font-bold">Vendor Dashboard</span>
                    <Link href="/" className="text-sm font-medium text-white/80">Exit</Link>
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
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Location</label>
                                    <div className="h-64 rounded-xl overflow-hidden border-2 border-slate-100 mb-3 relative">
                                        <LocationPicker onLocationSelect={(lat, lng) => setNewPlace(prev => ({ ...prev, coordinates: { lat, lng } }))} />
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
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-slate-50">
                        <div className="max-w-2xl mx-auto">
                            {/* Header */}
                            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h1 className="text-2xl font-bold text-slate-900">{selectedPlace.name}</h1>
                                        <span className={cn(
                                            "px-3 py-1 text-xs font-bold rounded-full",
                                            selectedPlace.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {selectedPlace.isApproved ? '● Live' : '○ Pending'}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-sm">{activeQueue.length} in queue • ~{activeQueue.length * 5}m wait</p>
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

                            {!selectedPlace.isApproved && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 text-amber-800 text-sm">
                                    <Clock className="w-5 h-5 shrink-0" />
                                    <p>Your business is <strong>hidden from the map</strong> pending admin approval. You can still test queues internally.</p>
                                </div>
                            )}

                            {/* Current Serving Card */}
                            <div className="bg-white rounded-3xl p-8 shadow-lg border border-slate-100 text-center mb-6">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Now Serving</p>
                                <div className="text-7xl md:text-8xl font-black text-slate-900 mb-6">
                                    {currentlyServing.length > 0 ? currentlyServing[0].tokenNumber : "--"}
                                </div>

                                {currentlyServing.length > 0 && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'completed')}
                                            className="py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle2 className="w-6 h-6" /> Done
                                        </button>
                                        <button
                                            onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'cancelled')}
                                            className="py-4 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
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
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 p-8">
                        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mb-6">
                            <Store className="w-12 h-12 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Select a Business</h2>
                        <p className="max-w-md text-center text-slate-500">
                            Choose a business from the sidebar to manage its queue, or add a new one.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
