"use client";

import { usePlaces } from "@/context/PlacesContext";
import { ArrowLeft, Calendar, Clock, MapPin, CheckCircle2, XCircle, History as HistoryIcon } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

export default function HistoryPage() {
    const { user, historyTickets, places, refreshHistory, clearHistory } = usePlaces();

    // Protect Route
    useEffect(() => {
        console.log("HistoryPage: User state changed:", user ? user.id : "null");
        console.log("HistoryPage: Current History Tickets:", historyTickets.length);
        if (user) {
            console.log("HistoryPage: Triggering refreshHistory...");
            refreshHistory();
        }
    }, [user]);

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">History</h1>
                    <p className="mb-6 text-slate-500">Please log in to view your journey.</p>
                    <Link href="/login" className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">Log In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <div className="max-w-3xl mx-auto px-6 py-12">

                {/* Header */}
                <header className="mb-12">
                    <Link href="/" className="inline-flex items-center text-sm font-bold text-slate-400 hover:text-indigo-600 transition-colors mb-6 group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Map
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                            <HistoryIcon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Your Journey</h1>
                            <p className="text-slate-500 font-medium">Past queues and visits.</p>
                        </div>
                        {historyTickets.length > 0 && (
                            <button
                                onClick={() => {
                                    if (confirm("Clear your entire history? This cannot be undone.")) {
                                        clearHistory();
                                    }
                                }}
                                className="text-xs font-bold text-rose-500 hover:text-rose-600 px-4 py-2 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </header>

                {/* Content */}
                <div className="space-y-6">
                    {historyTickets.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <HistoryIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">No History Yet</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mb-8">Join a queue to start your journey! Your completed visits will appear here.</p>
                            <Link href="/" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors">
                                Find a Place
                            </Link>
                        </div>
                    ) : (
                        historyTickets.map((ticket, index) => {
                            const place = places.find(p => p.id === ticket.placeId);
                            // Fallback if place not found (e.g. deleted), use ID or placeholder
                            const placeName = place ? place.name : "Unknown Place";
                            const date = new Date(ticket.timestamp);

                            return (
                                <div key={ticket.ticketId} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-6 animate-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 50}ms` }}>

                                    {/* Icon / Status */}
                                    <div className="shrink-0 flex sm:flex-col items-center gap-3 sm:w-24 sm:border-r border-slate-50 sm:pr-6">
                                        <div className="text-2xl font-black text-slate-900">{ticket.tokenNumber}</div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold capitalize flex items-center gap-1.5 ${ticket.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                            }`}>
                                            {ticket.status === 'completed' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {ticket.status}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-slate-900 mb-1">{placeName}</h3>
                                        {place && <p className="text-sm text-slate-400 font-medium mb-4 flex items-center gap-1"><MapPin className="w-3 h-3" /> {place.address}</p>}

                                        <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {date.toLocaleDateString()}
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-lg">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>

            </div>
        </div>
    );
}
