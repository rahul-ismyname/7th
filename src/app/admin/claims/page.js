"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
    ShieldCheck,
    X,
    Check,
    Clock,
    Mail,
    Phone,
    User,
    Store,
    AlertCircle,
    Search,
    Filter,
    CheckCircle2,
    Building2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminClaimsPage() {
    const { signOut } = useAuth();
    const router = useRouter();
    const [claims, setClaims] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("pending"); // pending, approved, rejected

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('claim_requests')
                .select(`
                    *,
                    places:place_id (name, address, id)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClaims(data || []);
        } catch (err) {
            console.error("Fetch claims error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (claimId, placeId, userId, newStatus) => {
        try {
            // 1. Update claim status
            const { error: claimError } = await supabase
                .from('claim_requests')
                .update({ status: newStatus })
                .eq('id', claimId);

            if (claimError) throw claimError;

            // 2. If approved, update place owner and make it approved
            if (newStatus === 'approved') {
                const { error: placeError } = await supabase
                    .from('places')
                    .update({
                        owner_id: userId,
                        is_approved: true // Automatically approve place if owner is verified
                    })
                    .eq('id', placeId);

                if (placeError) throw placeError;
            }

            // Refresh list
            fetchClaims();
        } catch (err) {
            alert("Action failed: " + err.message);
        }
    };

    const filteredClaims = claims.filter(c => {
        const matchesQuery = (c.full_name + c.places?.name).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = c.status === filter;
        return matchesQuery && matchesFilter;
    });

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
                    <h1 className="text-3xl font-black text-slate-900 mb-2">Claim Verifications</h1>
                    <p className="text-slate-500 font-medium">Review and approve business ownership requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search claims..."
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
                    title="Total Claims"
                    value={claims.length}
                    subtext="All time requests"
                    icon={Building2}
                    colorClass={{ bg: "bg-slate-100", text: "text-slate-600" }}
                    gradientClass="bg-slate-900"
                />
                <StatsCard
                    title="Pending Action"
                    value={claims.filter(c => c.status === 'pending').length}
                    subtext="Requires attention"
                    icon={Clock}
                    colorClass={{ bg: "bg-amber-100", text: "text-amber-600" }}
                    gradientClass="bg-amber-500"
                />
                <StatsCard
                    title="Verified Owners"
                    value={claims.filter(c => c.status === 'approved').length}
                    subtext="Successfully onboarded"
                    icon={CheckCircle2}
                    colorClass={{ bg: "bg-emerald-100", text: "text-emerald-600" }}
                    gradientClass="bg-emerald-500"
                />
            </div>

            {/* Filter Tabs - Segmented Control */}
            <div className="mb-8">
                <div className="inline-flex bg-slate-100/80 p-1.5 rounded-2xl">
                    {['pending', 'approved', 'rejected'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                "px-6 py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-200 flex items-center gap-2",
                                filter === f
                                    ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            {f === 'pending' && <Clock className="w-4 h-4" />}
                            {f === 'approved' && <Check className="w-4 h-4" />}
                            {f === 'rejected' && <X className="w-4 h-4" />}
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-slate-100 shadow-sm" />
                    ))}
                </div>
            ) : filteredClaims.length === 0 ? (
                <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <Clock size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600">No {filter} requests found</h3>
                    <p className="text-slate-400">All clear for now!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClaims.map((claim) => (
                        <div key={claim.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all overflow-hidden relative group">
                            <div className={cn(
                                "h-1.5 w-full",
                                claim.status === 'pending' ? "bg-amber-400" :
                                    claim.status === 'approved' ? "bg-emerald-500" : "bg-rose-500"
                            )} />

                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{claim.places?.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                            <Store size={12} />
                                            {claim.places?.address}
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                                        claim.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-100" :
                                            claim.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                                    )}>
                                        {claim.status}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                                        <div className="flex items-center gap-3 mb-2">
                                            <User size={16} className="text-indigo-500" />
                                            <span className="font-bold text-slate-700 text-sm">{claim.full_name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Mail size={16} className="text-indigo-500" />
                                            <span className="text-slate-500 text-xs font-medium">{claim.business_email}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Phone size={16} className="text-indigo-500" />
                                            <span className="text-slate-500 text-xs font-medium">{claim.phone}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                            <AlertCircle size={10} /> Verification Weight
                                        </h4>
                                        <p className="text-xs text-slate-600 leading-relaxed bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50 italic">
                                            "{claim.verification_info}"
                                        </p>
                                    </div>
                                </div>

                                {claim.status === 'pending' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleAction(claim.id, claim.place_id, claim.user_id, 'approved')}
                                            className="bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-95"
                                        >
                                            <Check size={18} /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(claim.id, claim.place_id, claim.user_id, 'rejected')}
                                            className="bg-white border border-slate-200 text-rose-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-100 transition-all active:scale-95"
                                        >
                                            <X size={18} /> Reject
                                        </button>
                                    </div>
                                )}

                                <span className="absolute bottom-4 right-4 text-[10px] font-bold text-slate-300">
                                    {new Date(claim.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
