"use client";

import { cn, calculateDistance } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
    ArrowLeft,
    BadgeCheck,
    MapPin,
    Clock,
    Users,
    Info,
    Ticket,
    TrendingUp,
    Activity,
    AlertCircle,
    Check,
    Briefcase,
    Banknote,
    ArrowRight
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { AddWaitTimeModal } from "./AddWaitTimeModal";
import { JoinQueueModal } from "./JoinQueueModal";
import { ReviewFlowModal } from "./ReviewFlowModal";
import { CancelTicketModal } from "./CancelTicketModal";
import { usePlaces } from "@/context/PlacesContext";
import { useTickets } from "@/context/TicketsContext";

export function PlaceDetails({ place, onBack }) {
    const { joinQueue, leaveQueue, submitReview, completeTicket, activeTickets } = useTickets();
    const [showWaitTimeModal, setShowWaitTimeModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [reviewTicket, setReviewTicket] = useState(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    // Check if user has a ticket for this place
    const myTicket = activeTickets.find(t => t.placeId === place.id && t.status === 'waiting');
    const hasJoined = !!myTicket;

    // Dynamic Wait Time Logic
    const [peopleAhead, setPeopleAhead] = useState(null);
    const [waitTimes, setWaitTimes] = useState({});
    const [selectedCounterId, setSelectedCounterId] = useState(null);

    // Fetch position in queue for JOINED users



    const handleJoinClick = () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser");
            return;
        }

        setIsJoining(true); // Re-use spinner for location check

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                const dist = calculateDistance(userLat, userLng, place.coordinates.lat, place.coordinates.lng);

                setIsJoining(false);

                setShowJoinModal(true);
            },
            (error) => {
                setIsJoining(false);
                console.error("Location error:", error);
                alert("Location access is required to verify you are nearby. Please enable location services.");
            }
        );
    };

    useEffect(() => {
        if (!myTicket) return;

        const fetchPosition = async () => {
            // Count tickets strictly BEFORE my ticket
            let query = supabase
                .from('tickets')
                .select('*', { count: 'exact', head: true })
                .eq('place_id', place.id)
                .eq('status', 'waiting')
                .lt('created_at', new Date(myTicket.timestamp).toISOString());

            if (myTicket.counterId) {
                query = query.eq('counter_id', myTicket.counterId);
            }

            const { count, error } = await query;

            if (!error && count !== null) {
                setPeopleAhead(count);
            }
        };

        fetchPosition();

        // Optional: Subscription to update position live could go here
        // For now, fetch on mount/ticket change is MVP sufficient
    }, [myTicket, place.id]);

    const handleReviewSubmit = async (data) => {
        if (!myTicket) return;
        try {
            await submitReview(myTicket.ticketId, data);
            // Modal closes itself
        } catch (e) {
            console.error("Failed to submit review", e);
        }
    };

    const handleReviewComplete = async () => {
        if (!myTicket) return;
        try {
            await completeTicket(myTicket.ticketId);
        } catch (e) {
            console.error("Failed to complete ticket", e);
        }
    };

    const handleConfirmJoin = async (formData) => {
        if (hasJoined || isJoining) return;
        setIsJoining(true);

        try {
            // Race against a timeout to prevent infinite hanging
            await Promise.race([
                joinQueue(place.id, formData),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out")), 10000))
            ]);
        } catch (e) {
            console.error("Join Queue Error:", e);
            // Optional: alert if it was a timeout specifically, though joinQueue usually alerts its own errors
            if (e.message === "Request timed out") {
                alert("The request took too long. Please check your connection and try again.");
            }
        } finally {
            // ALWAYS close the modal and reset state
            setShowJoinModal(false);
            setIsJoining(false);
        }
    };

    // Helper to get service time based on ticket's counter
    const getServiceTime = () => {
        if (myTicket?.counterId && place.counters) {
            const counter = place.counters.find(c => c.id === myTicket.counterId);
            if (counter) return counter.average_service_time || 5;
        }
        return place.average_service_time || 5;
    };
    const avgServiceTime = getServiceTime();

    useEffect(() => {
        if (!place.id) return;

        const fetchWaitTimes = async () => {
            const { data, error } = await supabase
                .from('tickets')
                .select('counter_id')
                .eq('place_id', place.id)
                .eq('status', 'waiting');

            if (error) {
                console.error("Error fetching wait times:", error);
                return;
            }

            const counts = {};
            data.forEach(t => {
                const cId = t.counter_id || 'default';
                counts[cId] = (counts[cId] || 0) + 1;
            });

            const newWaitTimes = {};
            if (place.counters && place.counters.length > 0) {
                place.counters.forEach(c => {
                    const count = counts[c.id] || 0;
                    const avgTime = c.average_service_time || place.average_service_time || 5;
                    newWaitTimes[c.id] = count * avgTime;
                });
            } else {
                const count = counts['default'] || 0;
                const avgTime = place.average_service_time || 5;
                newWaitTimes['default'] = count * avgTime;
            }
            setWaitTimes(newWaitTimes);
        }

        fetchWaitTimes();

        // Subscribe to changes
        const subscription = supabase
            .channel(`public:tickets:place:${place.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `place_id=eq.${place.id}` }, () => {
                fetchWaitTimes();
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };

    }, [place.id, place.counters, place.average_service_time]);

    // Derived logic for counters with icons/colors
    const countersList = useMemo(() => {
        if (place.counters && place.counters.length > 0) {
            return place.counters.map((c, i) => ({
                id: c.id,
                label: c.name,
                icon: [Info, Briefcase, Users, Banknote][i % 4],
                color: ["bg-blue-50 text-blue-600 border-blue-200", "bg-emerald-50 text-emerald-600 border-emerald-200", "bg-violet-50 text-violet-600 border-violet-200", "bg-amber-50 text-amber-600 border-amber-200"][i % 4]
            }));
        }
        return [
            { id: "default", label: "General Queue", icon: Info, color: "bg-blue-50 text-blue-600 border-blue-200" }
        ];
    }, [place.counters]);

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Nav Bar */}
            <div className="px-5 pt-6 pb-2 shrink-0 flex items-center">
                <button
                    onClick={onBack}
                    className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-800 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
            </div>

            <div className="px-6 flex flex-col flex-1 overflow-y-auto pb-32">
                {/* Title Section - Fluid, no card */}
                {/* Title Section - Conditionally rendered or flexible based on mode */}
                {!hasJoined ? (
                    <div className="mb-8 mt-2">
                        <div className="flex justify-between items-start mb-3">
                            <div>
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2 mb-2">
                                    {place.name}
                                    {place.isApproved && (
                                        <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-50" />
                                    )}
                                </h1>
                                <div className="flex items-center text-sm font-bold text-slate-400 gap-1.5">
                                    <MapPin className="w-4 h-4 text-slate-300" />
                                    {place.address}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <div className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 text-slate-900">
                                    <span>★</span> {place.rating}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{place.distanceDisplay}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className={cn(
                                "w-full text-xs font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2",
                                place.isApproved
                                    ? "bg-blue-50 text-blue-600"
                                    : "bg-slate-50 text-slate-500"
                            )}>
                                {place.isApproved ? (
                                    <>
                                        <BadgeCheck className="w-4 h-4" />
                                        Official Partner • Virtual Queue Available
                                    </>
                                ) : (
                                    <>
                                        <Info className="w-4 h-4" />
                                        Crowdsourced Data • Live Wait Times
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Compact Header for Active Mode
                    <div className="mb-4 text-center">
                        <h1 className="text-xl font-black text-slate-900 flex items-center justify-center gap-2">
                            {place.name}
                            {place.isApproved && <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-50" />}
                        </h1>
                        <p className="text-xs font-bold text-slate-400">{place.address}</p>
                    </div>
                )}



                {/* MODE 1: Non-Approved (Information Only) */}
                {!place.isApproved && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Live Status</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <Clock className="w-6 h-6 text-slate-400 mb-2" />
                                    <span className="text-3xl font-bold text-foreground">{place.liveWaitTime}<span className="text-sm text-slate-400 font-normal ml-1">m</span></span>
                                    <span className="text-xs text-muted-foreground font-medium mt-1">Avg Wait</span>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                                    <Users className={cn("w-6 h-6 mb-2",
                                        place.crowdLevel === "High" ? "text-rose-500" :
                                            place.crowdLevel === "Medium" ? "text-amber-500" : "text-emerald-500"
                                    )} />
                                    <span className={cn("text-lg font-bold",
                                        place.crowdLevel === "High" ? "text-rose-600" :
                                            place.crowdLevel === "Medium" ? "text-amber-600" : "text-emerald-600"
                                    )}>{place.crowdLevel}</span>
                                    <span className="text-xs text-muted-foreground font-medium mt-1">Crowd Level</span>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 justify-center font-medium">
                                <Activity className="w-3 h-3" />
                                Updated {place.lastUpdated} • Accuracy: 94%
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 items-start">
                            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-blue-700 text-sm">Plan Ahead</h4>
                                <p className="text-xs text-blue-600/80 mt-1 leading-relaxed">
                                    This location does not offer a virtual queue. We recommend visiting after 2:00 PM for lower wait times.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowWaitTimeModal(true)}
                            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                            <Info className="w-5 h-5" />
                            Report Wait Time
                        </button>
                        <AddWaitTimeModal
                            isOpen={showWaitTimeModal}
                            onClose={() => setShowWaitTimeModal(false)}
                            place={place}
                        />
                    </div>
                )}

                {/* MODE 2: Approved (Virtual Queue) */}
                {place.isApproved && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {!hasJoined ? (
                            <>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2 px-1">
                                        <Info className="w-4 h-4 text-slate-400" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Service</span>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {countersList.map((c) => {
                                            const Icon = c.icon;
                                            const hasWaitTime = waitTimes[c.id] !== undefined;

                                            return (
                                                <button
                                                    key={c.id}
                                                    onClick={() => {
                                                        setSelectedCounterId(c.id);
                                                        setShowJoinModal(true);
                                                    }}
                                                    className="relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 group border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50 active:scale-[0.98]"
                                                >
                                                    <div className={cn(
                                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                                        c.color
                                                    )}>
                                                        <Icon className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-center mb-0.5">
                                                            <span className="font-bold text-base text-slate-900 truncate pr-2">
                                                                {c.label}
                                                            </span>
                                                            {hasWaitTime && (
                                                                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 pl-2 pr-2.5 py-1 rounded-full shrink-0">
                                                                    <Clock className="w-3 h-3" />
                                                                    {waitTimes[c.id]} min
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-slate-400 font-medium">₹20 Service Charge</span>
                                                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all opacity-0 group-hover:opacity-100" />
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                            </>
                        ) : (
                            <div className="flex flex-col h-full relative overflow-hidden bg-white text-slate-900 rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-slate-100 animate-in zoom-in-95 duration-500">
                                {/* Decorative Background Elements */}
                                <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-emerald-50 to-white" />
                                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-emerald-100/50 rounded-full blur-3xl opacity-60" />
                                <div className="absolute top-[20px] left-[-20px] w-24 h-24 bg-teal-100/50 rounded-full blur-2xl opacity-60" />

                                <div className="flex-1 flex flex-col items-center justify-between py-6 px-6 relative z-10">

                                    {/* Top Section: Status */}
                                    <div className="flex flex-col items-center text-center mt-2">
                                        <div className="relative mb-4">
                                            <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20 duration-[2000ms]" />
                                            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-200">
                                                <Ticket className="w-8 h-8 text-white" />
                                            </div>
                                            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md">
                                                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 mb-1">You're Checked In!</h3>
                                        <p className="text-slate-500 text-xs font-medium max-w-[200px] leading-relaxed">
                                            We'll notify you when it's your turn.
                                        </p>
                                    </div>

                                    {/* Middle Section: Card */}
                                    <div className="w-full bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden group my-4">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />

                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Your Token</span>
                                            <div className="text-5xl font-black text-slate-900 tracking-tighter tabular-nums mb-1">
                                                {myTicket?.tokenNumber?.replace('#', '') || "..."}
                                            </div>
                                        </div>

                                        <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 relative">
                                            <div className="absolute left-1/2 top-4 bottom-0 w-px bg-slate-100 -translate-x-1/2" />

                                            <div className="text-center">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">People Ahead</span>
                                                <span className="text-lg font-black text-slate-800">
                                                    {peopleAhead !== null ? peopleAhead : '...'}
                                                </span>
                                            </div>
                                            <div className="text-center">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Est. Time</span>
                                                <span className="text-lg font-black text-emerald-600">
                                                    {peopleAhead !== null ? (
                                                        new Date(Date.now() + ((peopleAhead + 1) * (avgServiceTime) * 60000))
                                                            .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    ) : '--:--'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Section: Actions */}
                                    <div className="w-full space-y-2.5">
                                        <button
                                            onClick={() => {
                                                if (myTicket) setReviewTicket(myTicket);
                                            }}
                                            className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-slate-900/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Check className="w-4 h-4" />
                                            Mark as Done
                                        </button>

                                        <button
                                            onClick={() => setShowCancelModal(true)}
                                            className="w-full bg-white border border-slate-200 text-rose-500 font-bold py-3.5 rounded-2xl hover:bg-rose-50 hover:border-rose-100 hover:text-rose-600 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                                        >
                                            Cancel Ticket
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <JoinQueueModal
                isOpen={showJoinModal}
                onClose={() => setShowJoinModal(false)}
                place={place}
                initialCounterId={selectedCounterId}
                onConfirm={handleConfirmJoin}
            />

            <ReviewFlowModal
                isOpen={!!reviewTicket}
                onClose={() => setReviewTicket(null)}
                ticket={reviewTicket}
                place={place}
                onComplete={async () => {
                    if (reviewTicket) await completeTicket(reviewTicket.ticketId);
                }}
                onSubmit={(data) => submitReview(reviewTicket?.ticketId, data)}
            />

            <CancelTicketModal
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={() => {
                    leaveQueue(place.id);
                    setShowCancelModal(false);
                }}
                placeName={place.name}
                ticketNumber={myTicket?.tokenNumber}
            />
        </div >
    );
}
