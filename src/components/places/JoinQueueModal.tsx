"use client";

import { Place } from "@/lib/data";
import { useState } from "react";
import { X, Calendar as CalendarIcon, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface JoinQueueModalProps {
    isOpen: boolean;
    onClose: () => void;
    place: Place;
    onConfirm: (data: JoinQueueFormData) => Promise<void>;
}

export interface JoinQueueFormData {
    counter: string;
    preferredTime: string;
}

export function JoinQueueModal({ isOpen, onClose, place, onConfirm }: JoinQueueModalProps) {
    const [formData, setFormData] = useState<JoinQueueFormData>({
        counter: "",
        preferredTime: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onConfirm(formData);
            onClose();
        } catch (error) {
            console.error("Error joining queue:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={cn(
                "bg-white w-full max-w-sm rounded-[2rem] shadow-2xl z-10 overflow-hidden transform transition-all duration-300",
                isOpen ? "translate-y-0 scale-100" : "translate-y-4 scale-95"
            )}>
                <div className="p-6 text-center">
                    <h2 className="text-xl font-bold text-slate-800">Join Virtual Queue</h2>
                    <p className="text-sm text-slate-500 mt-1">{place.name} • ₹20 service charge</p>

                    <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">


                        {/* Select Counter */}
                        <div className="relative">
                            <select
                                required
                                value={formData.counter}
                                onChange={(e) => setFormData(prev => ({ ...prev, counter: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer text-slate-600 has-[option[value='']:checked]:text-slate-400"
                            >
                                <option value="" disabled hidden>Select Counter</option>
                                <option value="counter-1">General Enquiry</option>
                                <option value="counter-2">Cash Deposit</option>
                                <option value="counter-3">Loans</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Preferred Time Slot */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Preferred Time Slot"
                                onFocus={(e) => e.target.type = 'time'}
                                onBlur={(e) => !e.target.value && (e.target.type = 'text')}
                                required
                                value={formData.preferredTime}
                                onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
                                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 min-h-[50px]"
                            />
                            <CalendarIcon className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 space-y-3">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Processing..." : "Pay ₹20 & Join"}
                            </button>

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="w-full text-slate-400 font-medium py-2 hover:text-slate-600 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
