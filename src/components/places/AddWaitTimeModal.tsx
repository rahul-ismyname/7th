"use client";

import { useState } from "react";
import { X, Clock, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

import { Place } from "@/lib/data";

interface AddWaitTimeModalProps {
    isOpen: boolean;
    onClose: () => void;
    place: Place;
}

export function AddWaitTimeModal({ isOpen, onClose, place }: AddWaitTimeModalProps) {
    const [step, setStep] = useState<"input" | "success">("input");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [waitTime, setWaitTime] = useState(place.liveWaitTime || 15);
    const [crowdLevel, setCrowdLevel] = useState<"Low" | "Medium" | "High">((place.crowdLevel) || "Medium");

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setIsSubmitting(true);

        try {
            const { error } = await supabase
                .from('places')
                .update({
                    live_wait_time: waitTime,
                    crowd_level: crowdLevel,
                    last_updated: new Date().toISOString()
                })
                .eq('id', place.id);

            if (error) {
                console.error("Error updating place:", error);
                alert("Failed to update. Please try again.");
                setIsSubmitting(false);
                return;
            }

            setStep("success");
            setTimeout(() => {
                onClose();
                setStep("input");
                setIsSubmitting(false);
            }, 2000);
        } catch (err) {
            console.error(err);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">

                {step === "input" ? (
                    <>
                        <div className="p-5 border-b border-border flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Update Status</h3>
                                <p className="text-xs text-muted-foreground font-medium">for {place.name}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-muted-foreground hover:text-foreground" />
                            </button>
                        </div>

                        <div className="p-6 space-y-8">
                            {/* Wait Time Slider */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-primary" />
                                        Current Wait Time
                                    </label>
                                    <span className="text-3xl font-black text-primary">{waitTime} <span className="text-sm font-medium text-muted-foreground">min</span></span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="120"
                                    step="5"
                                    value={waitTime}
                                    onChange={(e) => setWaitTime(Number(e.target.value))}
                                    className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground px-1 font-medium">
                                    <span>0m</span>
                                    <span>1h</span>
                                    <span>2h+</span>
                                </div>
                            </div>

                            {/* Crowd Level Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-4 h-4 text-primary" />
                                    Crowd Density
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {["Low", "Medium", "High"].map((level) => (
                                        <button
                                            key={level}
                                            onClick={() => setCrowdLevel(level as any)}
                                            className={cn(
                                                "py-3 px-2 rounded-xl text-sm font-bold border transition-all",
                                                crowdLevel === level
                                                    ? "border-primary bg-primary/10 text-primary"
                                                    : "border-border bg-white text-muted-foreground hover:bg-slate-50 hover:text-foreground"
                                            )}
                                        >
                                            {level}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
                            >
                                Submit Update
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 animate-in zoom-in spin-in-12 duration-500 border border-emerald-200 shadow-sm">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">Thank You!</h3>
                        <p className="text-muted-foreground text-sm max-w-[200px] leading-relaxed">
                            Your contribution helps others save time. The data will update shortly.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
