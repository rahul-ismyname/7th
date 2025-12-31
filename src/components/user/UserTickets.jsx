"use client";

import { useState, useEffect, useRef } from "react";
import { usePlaces } from "@/context/PlacesContext";
import { useTickets } from "@/context/TicketsContext";
import { Clock, MapPin, Ticket as TicketIcon, ArrowRight, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/Logo";

// Helper to send browser notification
const sendNotification = (title, body) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
    }
};

export function UserTickets({ onSelectPlace }) {
    const { activeTickets, historyTickets, leaveQueue } = useTickets();
    const { places } = usePlaces();
    const [view, setView] = useState('active');
    const [countdown, setCountdown] = useState(null);
    const notifiedRef = useRef({ fiveMin: new Set(), turn: new Set() });

    // Countdown Timer & Notification Effect
    useEffect(() => {
        if (activeTickets.length === 0) {
            setCountdown(null);
            return;
        }

        const activeTicket = activeTickets.find(t => t.status === 'waiting' || t.status === 'serving');
        if (!activeTicket) {
            setCountdown(null);
            return;
        }

        const place = places.find(p => p.id === activeTicket.placeId);

        // Calculate remaining time in seconds
        const joinedAt = activeTicket.timestamp;
        const estimatedWaitMs = (activeTicket.estimatedWait || 15) * 60 * 1000;
        const targetTime = joinedAt + estimatedWaitMs;

        const updateCountdown = () => {
            const now = Date.now();
            const remaining = Math.max(0, Math.floor((targetTime - now) / 1000));
            setCountdown(remaining);

            // 5-minute warning (remaining is 300 seconds)
            if (remaining <= 300 && remaining > 295 && !notifiedRef.current.fiveMin.has(activeTicket.ticketId)) {
                notifiedRef.current.fiveMin.add(activeTicket.ticketId);
                sendNotification("⏰ 5 Minutes Left!", `Your turn at ${place?.name || 'the queue'} is coming up soon!`);
            }

            // Turn notification (remaining is 0)
            if (remaining === 0 && !notifiedRef.current.turn.has(activeTicket.ticketId)) {
                notifiedRef.current.turn.add(activeTicket.ticketId);
                sendNotification("🎉 It's Your Turn!", `Head to ${place?.name || 'the queue'} now!`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [activeTickets, places]);

    // Format seconds to MM:SS
    const formatCountdown = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (activeTickets.length === 0 && historyTickets.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-transparent animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200 shadow-inner">
                    <Logo className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">No tickets yet</h3>
                <p className="text-sm text-slate-500 max-w-[200px]">Join a virtual queue to start saving time!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Header Area */}
            <div className="p-4 border-b border-border bg-transparent shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-xl text-foreground flex items-center gap-2">
                        My Tickets
                    </h2>
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default' && (
                        <button
                            onClick={() => Notification.requestPermission()}
                            className="text-xs bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-bold hover:bg-indigo-100 transition-colors"
                        >
                            Enable Alerts
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl relative">
                    <button
                        onClick={() => setView('active')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10",
                            view === 'active' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Active ({activeTickets.length})
                    </button>
                    <button
                        onClick={() => setView('history')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all relative z-10",
                            view === 'history' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        History
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {view === 'active' ? (
                    activeTickets.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm font-medium">No active tickets.</div>
                    ) : (
                        activeTickets.map((ticket) => {
                            const place = places.find(p => p.id === ticket.placeId);
                            if (!place) return null;

                            return (
                                <div key={ticket.ticketId} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative group transition-all hover:shadow-md hover:border-indigo-100">
                                    {/* Active Ticket Card Content (Same as before but refined) */}
                                    <div className="p-5 border-b border-slate-50 flex justify-between items-start bg-gradient-to-br from-white to-slate-50/50">
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-lg">{place.name}</h3>
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 font-medium">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {place.address}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Token</span>
                                            <span className="text-3xl font-black text-indigo-600 block leading-none tracking-tighter">{ticket.tokenNumber}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">Status</span>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${ticket.status === 'serving' ? 'bg-emerald-500 animate-ping' : 'bg-indigo-500 animate-pulse'}`} />
                                                <span className={`text-sm font-bold ${ticket.status === 'serving' ? 'text-emerald-600' : 'text-indigo-600'}`}>
                                                    {ticket.status === 'serving' ? 'Serving Now!' : 'Waiting'}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">
                                                {countdown !== null && countdown > 0 ? 'Time Left' : 'Est. Wait'}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <Clock className={`w-4 h-4 ${countdown !== null && countdown <= 300 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
                                                <span className={`text-sm font-bold ${countdown !== null && countdown <= 300 ? 'text-rose-600' : 'text-slate-700'}`}>
                                                    {countdown !== null ? (countdown > 0 ? formatCountdown(countdown) : "It's your turn!") : `${ticket.estimatedWait} mins`}
                                                </span>
                                            </div>
                                            {countdown !== null && countdown <= 300 && countdown > 0 && (
                                                <div className="mt-2 text-xs font-bold text-rose-500 flex items-center gap-1">
                                                    <Bell className="w-3 h-3" /> Almost there!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="p-2 bg-slate-50/50 border-t border-slate-100 flex gap-2">
                                        <button
                                            onClick={() => onSelectPlace(place.id)}
                                            className="flex-1 py-3 text-xs font-bold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm border border-transparent hover:border-slate-200"
                                        >
                                            View Place <ArrowRight className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => leaveQueue(ticket.placeId)}
                                            className="px-6 py-3 text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                        >
                                            Leave
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )
                ) : (
                    // HISTORY VIEW
                    historyTickets.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 text-sm font-medium">No history available.</div>
                    ) : (
                        historyTickets.map((ticket) => {
                            const place = places.find(p => p.id === ticket.placeId);
                            return (
                                <div key={ticket.ticketId} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between opacity-75 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${ticket.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                            {ticket.status === 'completed' ? 'DONE' : 'X'}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm">{place?.name || "Unknown Place"}</div>
                                            <div className="text-xs text-slate-400">{new Date(ticket.timestamp).toLocaleDateString()} at {new Date(ticket.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-300 text-sm">{ticket.tokenNumber}</div>
                                    </div>
                                </div>
                            )
                        })
                    )
                )}
            </div>
        </div>
    );
}
