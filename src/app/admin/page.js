"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, CheckCircle2, MapPin, Search, Building2, Clock, Trash2, AlertTriangle, Filter } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminPage() {
    const { user } = useAuth();
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

    // Premium Card Component
    const StatsCard = ({ title, value, subtext, icon: Icon, colorClass, gradientClass }) => (
        <div className="relative overflow-hidden rounded-3xl p-6 bg-white shadow-sm border border-slate-100 group hover:shadow-lg transition-all duration-300">
            <div className={cn("absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 rounded-full blur-2xl opacity-20", gradientClass)} />
            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className={cn("p-2 rounded-lg", colorClass.bg)}>
                        <Icon className={cn("w-5 h-5", colorClass.text)} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</span>
                </div>
                <div className="text-4xl font-black text-slate-900 tracking-tight">{value}</div>
                <div className="text-sm font-medium text-slate-400 mt-1">{subtext}</div>
            </div>
        </div>
    );

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Business Registry</h1>
                    <p className="text-slate-500 font-medium">Manage and verify business partners</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search businesses..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-3 w-full md:w-80 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <StatsCard
                    title="Total Businesses"
                    value={allPlaces.length}
                    subtext="All registered locations"
                    icon={Building2}
                    colorClass={{ bg: "bg-slate-100", text: "text-slate-600" }}
                    gradientClass="bg-slate-900"
                />
                <StatsCard
                    title="Pending Review"
                    value={allPlaces.filter(p => !p.is_approved).length}
                    subtext="Awaiting verification"
                    icon={Clock}
                    colorClass={{ bg: "bg-amber-100", text: "text-amber-600" }}
                    gradientClass="bg-amber-500"
                />
                <StatsCard
                    title="Active Partners"
                    value={allPlaces.filter(p => p.is_approved).length}
                    subtext="Live on platform"
                    icon={CheckCircle2}
                    colorClass={{ bg: "bg-emerald-100", text: "text-emerald-600" }}
                    gradientClass="bg-emerald-500"
                />
            </div>

            {/* Filter Tabs - Apple Segmented Control Style */}
            <div className="mb-8">
                <div className="inline-flex bg-slate-100/80 p-1.5 rounded-2xl">
                    {['pending', 'live', 'all'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-200 flex items-center gap-2",
                                activeTab === tab
                                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            {tab === 'pending' && <Clock className="w-4 h-4" />}
                            {tab === 'live' && <CheckCircle2 className="w-4 h-4" />}
                            {tab === 'all' && <Filter className="w-4 h-4" />}
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content List */}
            <div className="space-y-4">
                {errorMsg && (
                    <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl font-bold flex items-center gap-2 border border-rose-100">
                        <AlertTriangle className="w-5 h-5" />
                        {errorMsg}
                    </div>
                )}

                {loading ? (
                    <div className="grid grid-cols-1 gap-4">
                        {[1, 2, 3].map(n => (
                            <div key={n} className="h-24 bg-white rounded-3xl border border-slate-100 animate-pulse" />
                        ))}
                    </div>
                ) : filteredPlaces.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">No businesses found</h3>
                        <p className="text-slate-500">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    filteredPlaces.map(place => (
                        <div
                            key={place.id}
                            className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col md:flex-row items-center gap-6"
                        >
                            {/* Icon/Avatar */}
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shrink-0 transition-transform group-hover:scale-105 shadow-sm",
                                place.is_approved
                                    ? "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-200"
                                    : "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-200"
                            )}>
                                {place.name[0]}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center md:text-left min-w-0">
                                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                    <h3 className="font-bold text-lg text-slate-900 truncate">{place.name}</h3>
                                    {place.is_approved && <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50" />}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-slate-500 font-medium">
                                    <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                                        <Building2 className="w-3.5 h-3.5" /> {place.type}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" /> {place.address}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 shrink-0">
                                {place.is_approved ? (
                                    <button
                                        onClick={() => updateStatus(place.id, false)}
                                        className="px-4 py-2 bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-600 rounded-xl text-xs font-bold transition-all border border-slate-200 hover:border-amber-200 flex items-center gap-2"
                                    >
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Suspend
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => updateStatus(place.id, true)}
                                        className="px-6 py-2 bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-emerald-200 flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Approve
                                    </button>
                                )}
                                <button
                                    onClick={() => handleDelete(place.id)}
                                    className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
