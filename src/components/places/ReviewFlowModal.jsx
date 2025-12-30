"use client";

import { useState, useEffect } from "react";
import { X, Check, Timer, } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReviewFlowModal({ isOpen, onClose, place, ticket, onComplete, onSubmit }) {
    const [step, setStep] = useState(1);
    const [waitTime, setWaitTime] = useState(15);
    const [counterUsed, setCounterUsed] = useState("");
    const [otherCounter, setOtherCounter] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize/Update wait time based on actual elapsed time when modal opens
    useEffect(() => {
        if (isOpen && ticket) {
            // Default to the ESTIMATED wait time (as requested by user), so they can just click confirm
            if (ticket.estimatedWait) {
                setWaitTime(ticket.estimatedWait);
            } else {
                // Fallback to elapsed if for some reason estimated is missing
                const start = ticket.timestamp || Date.now();
                const elapsed = Math.max(1, Math.round((Date.now() - start) / 60000));
                setWaitTime(elapsed);
            }
        }
    }, [isOpen, ticket]);

    if (!isOpen) return null;

    const handleNext = async () => {
        if (step === 1) {
            // User confirmed they are done -> Mark as completed immediately
            await onComplete();
        }
        setStep((prev) => (prev + 1));
    };

    const handleBack = () => {
        setStep((prev) => (prev - 1));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        const finalCounter = counterUsed === "Other" ? otherCounter : counterUsed;
        await onSubmit({
            actualWaitTime: waitTime,
            counterUsed: finalCounter
        });
        setIsSubmitting(false);
        onClose();
        // Reset state after close
        setTimeout(() => {
            setStep(1);
            setWaitTime(20);
            setCounterUsed("");
            setOtherCounter("");
        }, 500);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl z-10 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">{place.name}</h2>

                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <h3 className="text-lg font-medium text-slate-600 leading-relaxed">
                                Have you completed your work here today?
                            </h3>
                            <div className="flex gap-4 justify-center">
                                <button
                                    onClick={handleNext}
                                    className="px-8 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl font-bold active:scale-95 transition-all"
                                >
                                    No
                                </button>
                            </div>

                        </div>



                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-300">
                            <h3 className="text-lg font-medium text-slate-600">
                                How long did you wait?
                            </h3>

                            <div className="px-2">
                                <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                                    <span>0m</span>
                                    <span className="text-indigo-600 text-lg -mt-2">{waitTime}min</span>
                                    <span>120m</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="120"
                                    value={waitTime}
                                    onChange={(e) => setWaitTime(Number(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                />
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                            >
                                Next
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                            <h3 className="text-lg font-medium text-slate-600">
                                Which Counter did you use?
                            </h3>

                            <div className="grid grid-cols-2 gap-3">
                                {["Cash", "Loan", "Account Services", "Other"].map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setCounterUsed(c)}
                                        className={cn(
                                            "py-3 px-2 rounded-xl text-sm font-bold border transition-all",
                                            counterUsed === c
                                                ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-slate-50"
                                        )}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>

                            {counterUsed === "Other" && (
                                <input
                                    type="text"
                                    placeholder="Enter counter name (Optional)"
                                    value={otherCounter}
                                    onChange={(e) => setOtherCounter(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 transition-all"
                                />
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!counterUsed || isSubmitting}
                                    className="flex-[2] py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
