"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ShieldCheck,
    X,
    Check,
    Clock,
    Mail,
    Phone,
    User,
    Store,
    ExternalLink,
    AlertCircle,
    Search,
    LogOut,
    ArrowLeft
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

    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-indigo-600 rounded-xl text-white">
                                <ShieldCheck size={28} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 font-outfit">Claim Verifications</h1>
                        </div>
                        <p className="text-slate-500 font-medium ml-1">Review and approve business ownership requests</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
                        {['pending', 'approved', 'rejected'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-sm font-bold capitalize transition-all",
                                    filter === f
                                        ? "bg-slate-900 text-white shadow-md"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {f}
                            </button>
                        ))}
                        <div className="w-[1px] h-6 bg-slate-100 hidden md:block mx-1" />
                        <Link
                            href="/"
                            onClick={() => localStorage.setItem("waitly_mode", "user")}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" /> Exit to App
                        </Link>
                        <button
                            onClick={async () => {
                                await signOut();
                                router.push('/');
                            }}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-500 hover:text-rose-600 transition-all"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>
                </header>

                <div className="mb-8 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by business or owner name..."
                        className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-3xl p-6 h-64 animate-pulse border border-slate-100 shadow-sm" />
                        ))}
                    </div>
                ) : filteredClaims.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-slate-300">
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
                                    "h-2 w-full",
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
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            claim.status === 'pending' ? "bg-amber-50 text-amber-600" :
                                                claim.status === 'approved' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                        )}>
                                            {claim.status}
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
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
                                                className="bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
                                            >
                                                <Check size={18} /> Approve
                                            </button>
                                            <button
                                                onClick={() => handleAction(claim.id, claim.place_id, claim.user_id, 'rejected')}
                                                className="bg-white border border-slate-200 text-rose-500 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-rose-50 hover:border-rose-100 transition-all"
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
        </div>
    );
}
