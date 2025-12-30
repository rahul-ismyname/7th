"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { usePlaces } from "@/context/PlacesContext";
import { ShieldCheck, CheckCircle2, XCircle, MapPin, Search, ArrowLeft, Building2, Clock, Trash2, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
    const { user } = usePlaces();
    const [allPlaces, setAllPlaces] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState('pending');

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

    const filteredPlaces = allPlaces.filter(place => {
        const matchesSearch = place.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            place.name.toLowerCase().includes(searchQuery.toLowerCase());

        if (searchQuery) return matchesSearch;

        if (activeTab === 'pending') return !place.is_approved;
        if (activeTab === 'live') return place.is_approved;
        return true;
    });

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

    const updateStatus = async (placeId, isApproved) => {
        const { error } = await supabase
            .from('places')
            .update({ is_approved: isApproved })
            .eq('id', placeId);

        if (!error) {
            fetchAllPlaces();
        } else {
            alert("Failed to update status");
        }
    };

    const handleDelete = async (placeId) => {
        if (!confirm("Are you sure you want to delete this business? This cannot be undone.")) return;

        const { error } = await supabase
            .from('places')
            .delete()
            .eq('id', placeId);

        if (!error) {
            fetchAllPlaces();
        } else {
            console.error(error);
            alert("Failed to delete business");
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
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Minimal Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-md shadow-slate-200">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-lg font-black tracking-tight text-slate-900">Admin Platform</h1>
                        </div>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-full text-sm font-bold text-slate-600 transition-all border border-slate-100"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Exit
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto p-6 md:p-10">
                {/* Stats Cards - Fluid Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3 mb-2 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            <Building2 className="w-4 h-4" /> Total
                        </div>
                        <div className="text-4xl font-black text-slate-900">{filteredPlaces.length}</div>
                        <div className="text-sm text-slate-500 font-medium mt-1">Businesses Registered</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-amber-50/50 border border-amber-100">
                        <div className="flex items-center gap-3 mb-2 text-amber-500 font-bold text-xs uppercase tracking-wider">
                            <Clock className="w-4 h-4" /> Pending
                        </div>
                        <div className="text-4xl font-black text-amber-600">{pendingCount}</div>
                        <div className="text-sm text-amber-600/80 font-medium mt-1">Awaiting Approval</div>
                    </div>
                    <div className="p-6 rounded-3xl bg-emerald-50/50 border border-emerald-100">
                        <div className="flex items-center gap-3 mb-2 text-emerald-500 font-bold text-xs uppercase tracking-wider">
                            <CheckCircle2 className="w-4 h-4" /> Live
                        </div>
                        <div className="text-4xl font-black text-emerald-600">{approvedCount}</div>
                        <div className="text-sm text-emerald-600/80 font-medium mt-1">Active on Platform</div>
                    </div>
                </div>

                {/* Search & Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Registry</h2>
                        {errorMsg && (
                            <div className="mt-2 text-rose-600 text-sm font-bold">
                                Error: {errorMsg}
                            </div>
                        )}
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search businesses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 hover:bg-slate-100 border border-transparent rounded-xl text-sm font-bold transition-all focus:bg-white focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
                        />
                    </div>
                </div>

                {/* Tabs & Filters */}
                {!searchQuery ? (
                    <div className="flex gap-1 mb-6 p-1 bg-slate-100 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'pending'
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Pending Review <span className="ml-1 opacity-60 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('live')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'live'
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Live Businesses <span className="ml-1 opacity-60 text-xs bg-slate-200 px-1.5 py-0.5 rounded-full">{approvedCount}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all'
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            All
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-lg w-fit">
                        <Search className="w-4 h-4" />
                        Searching entire registry for "{searchQuery}"
                    </div>
                )}

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
                                    <div className="flex items-center gap-2 md:shrink-0">
                                        <div className="text-right text-xs text-slate-400 hidden md:block mr-2">
                                            <div>{place.created_at ? new Date(place.created_at).toLocaleDateString() : 'Unknown'}</div>
                                            <div>{place.created_at ? new Date(place.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                                        </div>

                                        {place.is_approved ? (
                                            <button
                                                onClick={() => updateStatus(place.id, false)}
                                                className="flex items-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg text-xs font-bold transition-all border border-amber-100"
                                                title="Suspend Business"
                                            >
                                                <AlertTriangle className="w-3.5 h-3.5" />
                                                Suspend
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => updateStatus(place.id, true)}
                                                className="flex items-center gap-2 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg text-xs font-bold transition-all border border-emerald-100"
                                                title="Approve Business"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Approve
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(place.id)}
                                            className="p-2 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-all border border-slate-100 hover:border-rose-100"
                                            title="Delete Business"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
