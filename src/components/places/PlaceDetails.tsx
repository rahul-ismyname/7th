"use client";

import { Place } from "@/lib/data";
import { cn } from "@/lib/utils";
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
    AlertCircle
} from "lucide-react";
import { useState } from "react";
import { AddWaitTimeModal } from "./AddWaitTimeModal";
import { usePlaces } from "@/context/PlacesContext";

interface PlaceDetailsProps {
    place: Place;
    onBack: () => void;
}

export function PlaceDetails({ place, onBack }: PlaceDetailsProps) {
    const { activeTickets, joinQueue, leaveQueue } = usePlaces();
    const [showWaitTimeModal, setShowWaitTimeModal] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    // Check if user has a ticket for this place
    const myTicket = activeTickets.find(t => t.placeId === place.id && t.status === 'waiting');
    const hasJoined = !!myTicket;

    const handleJoin = async () => {
        if (hasJoined || isJoining) return;
        setIsJoining(true);
        try {
            await joinQueue(place.id);
            // activeTickets will update via Realtime, flipping hasJoined to true
        } catch (e) {
            console.error(e);
            setIsJoining(false);
        }
        // Safety timeout in case something hangs
        setTimeout(() => setIsJoining(false), 3000);
    };

    return (
        <div className="flex flex-col h-full bg-background relative">
            {/* Header Image Area (Mock) */}
            <div className="h-32 bg-slate-100 w-full relative group overflow-hidden shrink-0">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                <button
                    onClick={onBack}
                    className="absolute top-4 left-4 p-2 bg-white/90 backdrop-blur-md rounded-full text-slate-700 hover:bg-white transition-colors z-10 shadow-sm"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
            </div>

            <div className="px-6 -mt-8 relative z-10 flex flex-col flex-1 overflow-y-auto pb-8">
                {/* Title Card */}
                <div className="bg-card rounded-2xl shadow-xl border border-border p-5 mb-6 backdrop-blur-xl">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                                {place.name}
                                {place.isApproved && (
                                    <BadgeCheck className="w-6 h-6 text-blue-500 fill-blue-500/10" />
                                )}
                            </h1>
                            <div className="flex items-center text-sm text-muted-foreground gap-1 mt-1 font-medium">
                                <MapPin className="w-3.5 h-3.5" />
                                {place.address}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                ★ {place.rating}
                            </div>
                            <span className="text-xs text-muted-foreground mt-1 font-medium">{place.distance}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {place.isApproved ? (
                            <div className="w-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-semibold px-3 py-2.5 rounded-xl flex items-center justify-center gap-2">
                                <BadgeCheck className="w-4 h-4" />
                                Official Partner • Virtual Queue Added
                            </div>
                        ) : (
                            <div className="w-full bg-slate-50 border border-slate-100 text-slate-500 text-xs font-medium px-3 py-2.5 rounded-xl flex items-center justify-center gap-2">
                                <Info className="w-4 h-4" />
                                Crowdsourced Data • Live Wait Times
                            </div>
                        )}
                    </div>
                </div>

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
                                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Queue Status</h3>
                                    <div className="flex justify-between items-end mb-6">
                                        <div className="flex flex-col">
                                            <span className="text-5xl font-black text-foreground tracking-tight">{place.queueLength}</span>
                                            <span className="text-sm text-muted-foreground font-medium">People ahead</span>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg text-xs">
                                                <TrendingUp className="w-3.5 h-3.5" />
                                                Moving Fast
                                            </div>
                                            <span className="text-xs text-muted-foreground mt-2 font-medium">Est. wait: {place.liveWaitTime} min</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-sm py-3 border-b border-border border-dashed">
                                            <span className="text-muted-foreground font-medium">Current Token</span>
                                            <span className="font-mono font-bold text-foreground">{place.currentServingToken}</span>
                                        </div>
                                        <div className="flex justify-between text-sm py-3 border-b border-border border-dashed">
                                            <span className="text-muted-foreground font-medium">Your Est. Turn</span>
                                            <span className="font-bold text-foreground">{place.estimatedTurnTime}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleJoin}
                                    disabled={isJoining}
                                    className="w-full bg-primary hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                >
                                    {isJoining ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            <Ticket className="w-5 h-5" />
                                            Join Virtual Queue
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-muted-foreground font-medium opacity-60">
                                    You can browse other places while you wait.
                                </p>
                            </>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 text-center animate-in zoom-in-95 duration-300">
                                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-sm">
                                    <Ticket className="w-10 h-10" />
                                </div>
                                <h3 className="text-emerald-800 font-bold text-xl mb-1">You&apos;re in the queue!</h3>
                                <p className="text-emerald-600 text-sm mb-8 font-medium">We&apos;ll notify you when it&apos;s your turn.</p>

                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100 mb-6">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Your Token</span>
                                    <div className="text-4xl font-mono font-black text-slate-800 mt-2 tracking-tight">
                                        #{myTicket?.tokenNumber || "..."}
                                    </div>
                                </div>

                                <button
                                    onClick={() => leaveQueue(place.id)}
                                    className="text-xs text-rose-500 hover:text-rose-600 font-bold hover:underline transition-colors"
                                >
                                    Leave Queue
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
