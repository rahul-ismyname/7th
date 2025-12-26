"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePlaces } from "@/context/PlacesContext";
import { ShieldCheck, CheckCircle2, XCircle, MapPin, Search, ArrowLeft, Building2, Clock, Users } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    const { user } = usePlaces();
    const [allPlaces, setAllPlaces] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchAllPlaces = async () => {
        setLoading(true);
        setErrorMsg(null);
        const { data, error } = await supabase
            .from('places')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Admin Fetch Error:", error);
            setErrorMsg(error.message);
        } else if (data) {
            setAllPlaces(data);
        }
        setLoading(false);
    };

    const filteredPlaces = allPlaces.filter(place =>
        place.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        place.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchAllPlaces();

        const channel = supabase
            .channel('admin_places')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'places'
            }, () => {
                fetchAllPlaces();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const toggleApproval = async (placeId: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('places')
            .update({ is_approved: !currentStatus })
            .eq('id', placeId);

        if (!error) {
            fetchAllPlaces();
        } else {
            alert("Failed to update status");
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <ShieldCheck className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h1 className="text-xl font-bold mb-4">Admin Access Required</h1>
                <Link href="/login" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl font-bold">
                    Log In
                </Link>
            </div>
        </div>
    );

    const pendingCount = filteredPlaces.filter(p => !p.is_approved).length;
    const approvedCount = filteredPlaces.filter(p => p.is_approved).length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Gradient Header */}
            <header className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-5">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <ShieldCheck className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">Admin Console</h1>
                                <p className="text-sm text-slate-400">Platform Management</p>
                            </div>
                        </div>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl text-sm font-bold transition-all"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to App
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-violet-100 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-slate-900">{filteredPlaces.length}</div>
                                <div className="text-sm text-slate-500 font-medium">Total Businesses</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-amber-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                                <div className="text-sm text-slate-500 font-medium">Pending Approval</div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
                                <div className="text-sm text-slate-500 font-medium">Approved & Live</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Business Registry</h2>
                        {errorMsg && (
                            <div className="mt-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-sm font-bold">
                                Error: {errorMsg}
                            </div>
                        )}
                    </div>
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border-2 border-transparent rounded-xl text-sm font-medium focus:outline-none focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Business List */}
                <div className="space-y-3">
                    {loading ? (
                        <div className="bg-white rounded-2xl p-12 text-center">
                            <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">Loading businesses...</p>
                        </div>
                    ) : filteredPlaces.length === 0 ? (
                        <div className="bg-white rounded-2xl p-12 text-center">
                            <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 font-medium">No businesses found</p>
                        </div>
                    ) : (
                        filteredPlaces.map(place => (
                            <div
                                key={place.id}
                                className={`bg-white rounded-2xl p-5 border-2 transition-all hover:shadow-md ${place.is_approved ? 'border-slate-100' : 'border-amber-200 bg-amber-50/30'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    {/* Business Info */}
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${place.is_approved
                                                ? 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white'
                                                : 'bg-gradient-to-br from-amber-400 to-orange-400 text-white'
                                            }`}>
                                            {place.name[0]}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 truncate">{place.name}</h3>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                                                    {place.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <MapPin className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{place.address}</span>
                                            </div>
                                            <div className="mt-1 text-xs text-slate-400 font-mono">
                                                ID: {place.id}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-3 md:shrink-0">
                                        <div className="text-right text-xs text-slate-400 hidden md:block">
                                            <div>{place.created_at ? new Date(place.created_at).toLocaleDateString() : 'Unknown'}</div>
                                            <div>{place.created_at ? new Date(place.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                        </div>
                                        {place.is_approved ? (
                                            <button
                                                onClick={() => toggleApproval(place.id, true)}
                                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 rounded-xl text-sm font-bold transition-all"
                                            >
                                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                                                Approved
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => toggleApproval(place.id, false)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 transition-all"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Approve
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
