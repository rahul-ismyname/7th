"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useMemo } from "react";
import { usePlaces } from "@/context/PlacesContext";
import { useAuth } from "@/context/AuthContext";
import { useVendor } from "@/context/VendorContext";
import { useRouter } from "next/navigation";
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
    MapPin,
    Timer,
    LogOut
} from "lucide-react";
import Link from "next/link";
import QRCode from "react-qr-code";
import dynamic from "next/dynamic";

const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), {
    ssr: false,
    loading: () => <div className="w-full h-full bg-slate-100 animate-pulse rounded-xl" />
});

export default function VendorPage() {
    const { user, signOut } = useAuth();
    const { vendorPlaces, addPlace, removePlace, updateTicketStatus, callNextTicket, addCounter, deleteCounter } = useVendor();
    const router = useRouter();

    const [selectedPlaceId, setSelectedPlaceId] = useState(null);
    const [selectedCounterId, setSelectedCounterId] = useState(null); // New: Select specific counter
    const [vendorTickets, setVendorTickets] = useState([]);
    const [isCreating, setIsCreating] = useState(false);
    const [isAddingCounter, setIsAddingCounter] = useState(false); // New: Add counter mode
    const [showQR, setShowQR] = useState(false);

    // Set mode to vendor on mount
    useEffect(() => {
        localStorage.setItem("waitly_mode", "vendor");
    }, []);

    const [newPlace, setNewPlace] = useState({
        name: "", type: "", address: "", avgTime: 5
    });

    // Local state for editing settings
    const [hours, setHours] = useState({ open: "09:00", close: "17:00" });
    const [avgTime, setAvgTime] = useState(5);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    // New Counter State
    const [newCounter, setNewCounter] = useState({ name: "", avgTime: 5 });

    const [greeting, setGreeting] = useState("Good morning");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [mobileTab, setMobileTab] = useState("live"); // 'live' or 'settings'

    // Time-based greeting
    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Good morning");
        else if (hour < 18) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

    const myPlaces = useMemo(() => vendorPlaces, [vendorPlaces]);

    // Close mobile menu when a place is selected
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [selectedPlaceId, isCreating]);

    useEffect(() => {
        if (!selectedPlaceId) return;

        const fetchTickets = async () => {
            const { data } = await supabase
                .from('tickets')
                .select('*')
                .eq('place_id', selectedPlaceId)
                .order('created_at', { ascending: true });

            if (data) {
                const mapped = data.map((t) => ({
                    placeId: t.place_id,
                    ticketId: t.id,
                    tokenNumber: t.token_number,
                    estimatedWait: t.estimated_wait,
                    timestamp: new Date(t.created_at).getTime(),
                    status: t.status,
                    counterId: t.counter_id // Add counterId
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

    // Update local state when selected place OR COUNTER changes
    useEffect(() => {
        if (selectedPlaceId) {
            const place = vendorPlaces.find(p => p.id === selectedPlaceId);
            if (place) {
                // Default to first counter if none selected
                if (!selectedCounterId && place.counters && place.counters.length > 0) {
                    setSelectedCounterId(place.counters[0].id);
                    return;
                }

                const counter = place.counters?.find(c => c.id === selectedCounterId);
                if (counter) {
                    setHours({
                        open: counter.opening_time || "09:00",
                        close: counter.closing_time || "17:00"
                    });
                    setAvgTime(counter.average_service_time || 5);
                }
            }
        }
    }, [selectedPlaceId, selectedCounterId, vendorPlaces]);

    const handleSaveSettings = async () => {
        if (!selectedCounterId) return;
        setIsSavingSettings(true);

        const { error } = await supabase
            .from('counters')
            .update({
                opening_time: hours.open,
                closing_time: hours.close
            })
            .eq('id', selectedCounterId);

        if (error) {
            console.error("Error updating settings:", error);
            alert("Failed to update settings");
        } else {
            alert("Settings updated successfully!");
        }
        setIsSavingSettings(false);
    };

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2" />

                <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 md:p-12 shadow-2xl relative z-10 text-center animate-in zoom-in-95 duration-500">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-500/30">
                        <Store className="w-10 h-10 text-white" />
                    </div>

                    <h1 className="text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">Business Portal</h1>
                    <p className="text-indigo-200 font-medium text-lg mb-8 leading-relaxed">
                        Manage your queues, track analytics, and grow your business with Waitly.
                    </p>

                    <div className="space-y-3 w-full">
                        <button
                            onClick={async () => {
                                const { error } = await supabase.auth.signInWithOAuth({
                                    provider: 'google',
                                    options: {
                                        redirectTo: `${window.location.origin}/auth/callback?next=/vendor`,
                                    },
                                });
                                if (error) alert(error.message);
                            }}
                            className="w-full bg-white text-slate-700 font-bold py-4 rounded-2xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-[0.98]"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-white/20"></div>
                            <span className="flex-shrink-0 mx-4 text-indigo-200 text-xs font-bold uppercase">Or</span>
                            <div className="flex-grow border-t border-white/20"></div>
                        </div>

                        <Link
                            href="/login?role=vendor"
                            className="group relative w-full flex items-center justify-center px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all shadow-lg active:scale-[0.98] border border-white/20"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                Log In with Email
                                <ArrowLeft className="w-5 h-5 rotate-180 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                    </div>


                </div>
            </div>
        );
    }

    const handleCreateBusiness = (e) => {
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
            coordinates: newPlace.coordinates,
            averageServiceTime: Number(newPlace.avgTime) // Pass the initial time
        });
        setIsCreating(false);
        setNewPlace({ name: "", type: "", address: "", avgTime: 5 });
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsLocating(true);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setNewPlace(prev => ({
                    ...prev,
                    coordinates: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    }
                }));
                setIsLocating(false);
            },
            (error) => {
                console.error("Location error:", error);
                alert("Unable to retrieve your location. Please check your permissions.");
                setIsLocating(false);
            }
        );
    };

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

        // Dynamic import to avoid SSR issues if any, though likely safe as is
        const { requestBusinessDeletion } = await import("@/actions/business");
        const result = await requestBusinessDeletion(selectedPlaceId, user.email, place.name);

        if (result.success) {
            alert("📧 Confirmation email sent! Check your inbox and click the link to confirm deletion.");
        } else {
            alert("Failed to send confirmation email. Please try again.");
        }
    };

    const handleAddCounter = async (e) => {
        e.preventDefault();
        if (!selectedPlaceId) return;
        await addCounter(selectedPlaceId, {
            name: newCounter.name,
            avgServiceTime: newCounter.avgTime,
            openingTime: "09:00",
            closingTime: "17:00"
        });
        setIsAddingCounter(false);
        setNewCounter({ name: "", avgTime: 5 });
    };

    const handleDeleteCounter = async () => {
        if (!selectedCounterId || !selectedPlaceId) return;
        if (confirm("Delete this counter and all its tickets?")) {
            await deleteCounter(selectedCounterId, selectedPlaceId);
            setSelectedCounterId(null);
        }
    };

    // Filter tickets by Selected Counter
    const activeQueue = vendorTickets.filter(t => t.status === 'waiting' && t.counterId === selectedCounterId);
    const currentlyServing = vendorTickets.filter(t => t.status === 'serving' && t.counterId === selectedCounterId);
    const nextTicket = activeQueue[0];

    const onCallNext = async () => {
        if (!nextTicket) return;
        for (const t of currentlyServing) {
            await updateTicketStatus(t.ticketId, 'completed');
        }
        await updateTicketStatus(nextTicket.ticketId, 'serving');
        await callNextTicket(selectedPlaceId, nextTicket.tokenNumber);
    };

    const selectedPlace = myPlaces.find(p => p.id === selectedPlaceId);
    const selectedCounter = selectedPlace?.counters?.find(c => c.id === selectedCounterId);

    return (
        <div className="min-h-screen bg-white flex font-sans text-slate-900 md:overflow-hidden relative flex-col md:flex-row">
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
                            <Link
                                href="/"
                                onClick={() => localStorage.setItem("waitly_mode", "user")}
                                className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" /> Exit to App
                            </Link>
                        </div>
                    </div>
                </div>
            )}

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

                <div className="p-4 border-t border-slate-100 space-y-1">
                    <button
                        onClick={() => {
                            localStorage.setItem("waitly_mode", "user");
                            router.push('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all font-bold text-sm"
                    >
                        <Users className="w-5 h-5" />
                        Switch to User App
                    </button>
                    <button
                        onClick={async () => {
                            await signOut();
                            router.push('/');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all font-bold text-sm"
                    >
                        <LogOut className="w-5 h-5" />
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-[100dvh] md:min-h-0 md:h-screen md:overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden bg-gradient-to-r from-indigo-600 to-violet-600 p-4 flex flex-col gap-4 text-white shrink-0 z-20 shadow-md transition-all duration-300">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors">
                                {/* Hamburger Icon */}
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            <span className="font-bold text-lg truncate max-w-[200px]">{selectedPlace ? selectedPlace.name : "Dashboard"}</span>
                        </div>
                        {isCreating && <span className="text-sm font-medium bg-white/20 px-3 py-1 rounded-full">New</span>}
                    </div>

                    {/* Mobile Tabs (Only show if a place is selected and not creating) */}
                    {selectedPlaceId && !isCreating && (
                        <div className="flex p-1 bg-black/20 rounded-xl">
                            <button
                                onClick={() => setMobileTab("live")}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                                    mobileTab === "live" ? "bg-white text-indigo-600 shadow-sm" : "text-indigo-100 hover:bg-white/10"
                                )}
                            >
                                <Users className="w-4 h-4" /> Live Queue
                            </button>
                            <button
                                onClick={() => setMobileTab("settings")}
                                className={cn(
                                    "flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                                    mobileTab === "settings" ? "bg-white text-indigo-600 shadow-sm" : "text-indigo-100 hover:bg-white/10"
                                )}
                            >
                                <LayoutDashboard className="w-4 h-4" /> Manage
                            </button>
                        </div>
                    )}
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
                                    <div className="md:col-span-2">
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
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Avg. Service Time (mins)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                min="1"
                                                value={newPlace.avgTime}
                                                onChange={e => setNewPlace({ ...newPlace, avgTime: e.target.value })}
                                                className="w-full p-4 pl-12 bg-slate-50 border-2 border-transparent rounded-xl font-medium focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                                placeholder="e.g. 5"
                                                required
                                            />
                                            <Timer className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                        </div>
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
                            {/* Header (Hidden on Mobile "Live" View to save space, shown in Settings) */}
                            <header className={cn(
                                "mb-6 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6 border-b border-slate-100 pb-6 md:pb-8",
                                mobileTab === 'live' ? 'hidden md:flex' : 'flex'
                            )}>
                                <div>
                                    <div className="flex items-center gap-2 md:gap-4 mb-2">
                                        <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight">{selectedPlace.name}</h1>
                                        <span className={cn(
                                            "px-2 md:px-3 py-1 text-[10px] md:text-xs font-bold rounded-full border",
                                            selectedPlace.isApproved
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : "bg-amber-50 text-amber-600 border-amber-100"
                                        )}>
                                            {selectedPlace.isApproved ? '● Live' : '○ Pending'}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 font-medium text-sm md:text-lg">{activeQueue.length} tickets in queue • ~{activeQueue.length * 5} min wait</p>
                                    <div className="mt-2 flex items-center gap-2 hidden md:flex">
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
                                <div className="flex gap-2 w-full md:w-auto">
                                    <button onClick={() => setShowQR(true)} className="flex-1 md:flex-none p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2">
                                        <QrCode className="w-5 h-5" /> <span className="md:hidden text-sm font-bold">QR Code</span>
                                    </button>
                                    <button onClick={handleDeleteBusiness} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </header>

                            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                {selectedPlace.counters?.map(counter => (
                                    <button
                                        key={counter.id}
                                        onClick={() => { setSelectedCounterId(counter.id); setIsAddingCounter(false); }}
                                        className={cn(
                                            "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border",
                                            selectedCounterId === counter.id
                                                ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {counter.name}
                                    </button>
                                ))}
                                <button
                                    onClick={() => { setIsAddingCounter(true); setSelectedCounterId(null); setMobileTab('settings'); }}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all border border-dashed",
                                        isAddingCounter
                                            ? "bg-slate-900 text-white border-slate-900"
                                            : "bg-transparent text-slate-400 border-slate-300 hover:border-indigo-400 hover:text-indigo-600",
                                        mobileTab === 'live' ? 'hidden md:block' : 'block'
                                    )}
                                >
                                    + Add Counter
                                </button>
                            </div>

                            {/* Add Counter Form */}
                            {isAddingCounter && (
                                <div className={cn("mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4", mobileTab === 'live' ? 'hidden md:block' : 'block')}>
                                    <h3 className="font-bold text-lg mb-4">Add New Counter</h3>
                                    <form onSubmit={handleAddCounter} className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Counter Name</label>
                                            <input
                                                value={newCounter.name}
                                                onChange={e => setNewCounter({ ...newCounter, name: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                                placeholder="e.g. Express Lane"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1">Avg Service Time (mins)</label>
                                            <input
                                                type="number"
                                                value={newCounter.avgTime}
                                                onChange={e => setNewCounter({ ...newCounter, avgTime: e.target.value })}
                                                className="w-full p-3 rounded-xl border border-slate-200"
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Add Counter</button>
                                            <button type="button" onClick={() => setIsAddingCounter(false)} className="px-4 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold">Cancel</button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Ticket / Queue Views */}
                            {selectedCounterId && selectedCounter && (
                                <>
                                    {/* Working Hours Settings */}
                                    <div className={cn("mb-8 md:mb-12", mobileTab === 'live' ? 'hidden md:block' : 'block')}>
                                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Clock className="w-4 h-4" /> Operating Hours
                                        </h3>
                                        <div className="flex items-end gap-2 md:gap-4 p-1">
                                            <div className="flex-1">
                                                <label className="text-[10px] md:text-xs font-bold text-slate-500 mb-2 block">Opening</label>
                                                <input
                                                    type="time"
                                                    value={hours.open}
                                                    onChange={e => setHours(prev => ({ ...prev, open: e.target.value }))}
                                                    className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm md:text-base"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] md:text-xs font-bold text-slate-500 mb-2 block">Closing</label>
                                                <input
                                                    type="time"
                                                    value={hours.close}
                                                    onChange={e => setHours(prev => ({ ...prev, close: e.target.value }))}
                                                    className="w-full p-3 md:p-4 bg-slate-50 rounded-xl md:rounded-2xl font-bold text-slate-900 border-2 border-transparent focus:bg-white focus:border-indigo-100 outline-none transition-all text-sm md:text-base"
                                                />
                                            </div>
                                            <button
                                                onClick={handleSaveSettings}
                                                disabled={isSavingSettings}
                                                className="px-4 md:px-8 py-3 md:py-4 bg-slate-900 text-white font-bold rounded-xl md:rounded-2xl hover:bg-black transition-all disabled:opacity-50 text-sm md:text-base"
                                            >
                                                {isSavingSettings ? "..." : "Save"}
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
                                    <div className={cn("bg-slate-900 rounded-[2.5rem] p-6 md:p-10 text-center mb-8 relative overflow-hidden", mobileTab === 'settings' ? 'hidden md:block' : 'block')}>
                                        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
                                            <div className="absolute top-[-50%] left-[-50%] w-full h-full bg-indigo-500 blur-[100px] rounded-full" />
                                            <div className="absolute bottom-[-50%] right-[-50%] w-full h-full bg-fuchsia-500 blur-[100px] rounded-full" />
                                        </div>

                                        <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 md:mb-4 relative z-10">Now Serving</p>
                                        <div className="text-7xl md:text-9xl font-black text-white mb-6 md:mb-8 tracking-tighter relative z-10">
                                            {currentlyServing.length > 0 ? currentlyServing[0].tokenNumber : "--"}
                                        </div>

                                        {currentlyServing.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3 md:gap-4 max-w-sm mx-auto relative z-10">
                                                <button
                                                    onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'completed')}
                                                    className="py-3 md:py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg transition-all flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" /> Done
                                                </button>
                                                <button
                                                    onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'cancelled')}
                                                    className="py-3 md:py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl md:rounded-2xl font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-sm text-sm md:text-base"
                                                >
                                                    <XCircle className="w-5 h-5" /> No Show
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Call Next Button (Desktop) */}
                                    <button
                                        onClick={onCallNext}
                                        disabled={!nextTicket}
                                        className="hidden md:flex w-full py-6 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-3xl font-bold text-2xl shadow-2xl shadow-indigo-300 transition-all active:scale-[0.98] items-center justify-center gap-4"
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

                                    {/* Call Next Button (Mobile Sticky Footer - Context Aware) */}
                                    <div className={cn("md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40 pb-safe transition-transform duration-300", mobileTab === 'settings' ? 'translate-y-full' : 'translate-y-0')}>
                                        {currentlyServing.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-3">
                                                <button
                                                    onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'completed')}
                                                    className="py-4 bg-emerald-500 active:bg-emerald-600 text-white rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 className="w-6 h-6" /> Done
                                                </button>
                                                <button
                                                    onClick={async () => await updateTicketStatus(currentlyServing[0].ticketId, 'cancelled')}
                                                    className="py-4 bg-slate-100 active:bg-slate-200 text-slate-600 rounded-2xl font-bold text-lg flex items-center justify-center gap-2"
                                                >
                                                    <XCircle className="w-6 h-6" /> No Show
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={onCallNext}
                                                disabled={!nextTicket}
                                                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-400 text-white rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-[0.95] flex items-center justify-center gap-3"
                                            >
                                                {nextTicket ? (
                                                    <>
                                                        Call {nextTicket.tokenNumber}
                                                        <Megaphone className="w-6 h-6" />
                                                    </>
                                                ) : (
                                                    <span className="text-base font-medium">Queue Empty</span>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Spacer for sticky footer */}
                                    <div className={cn("md:hidden h-24", mobileTab === 'settings' ? 'hidden' : 'block')} />

                                    {/* Queue List */}
                                    <div className={cn("mt-6 bg-white rounded-2xl border border-slate-100 overflow-hidden", mobileTab === 'settings' ? 'hidden md:block' : 'block')}>
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
                                    <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                                        <button
                                            onClick={handleDeleteCounter}
                                            className="px-4 py-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                                        >
                                            <XCircle className="w-4 h-4" /> Delete This Counter
                                        </button>
                                    </div>
                                </>
                            )}
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
        </div >
    );
}
