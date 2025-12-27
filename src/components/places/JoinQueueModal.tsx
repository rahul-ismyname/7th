"use client";

import { Place } from "@/lib/data";
import { useState, useMemo, useRef } from "react";
import { X, Calendar as CalendarIcon, ChevronDown, Check, Clock, Banknote, FileText, Info, Briefcase, Sun, Moon, SunMedium } from "lucide-react";
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
    preferredDate: string;
}

export function JoinQueueModal({ isOpen, onClose, place, onConfirm }: JoinQueueModalProps) {
    const datePickerRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState<JoinQueueFormData>({
        counter: "",
        preferredTime: "",
        preferredDate: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const timeSlots = useMemo(() => {
        const start = place.openingTime || "09:00";
        const end = place.closingTime || "21:00";
        const groups = {
            morning: [] as string[],
            afternoon: [] as string[],
            evening: [] as string[]
        };

        let [startH, startM] = start.split(":").map(Number);
        const [endH, endM] = end.split(":").map(Number);

        const current = new Date();
        current.setHours(startH, startM, 0, 0);

        const endTime = new Date();
        endTime.setHours(endH, endM, 0, 0);

        while (current <= endTime) {
            const timeString = current.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
            const hour = current.getHours();

            if (hour < 12) groups.morning.push(timeString);
            else if (hour < 17) groups.afternoon.push(timeString);
            else groups.evening.push(timeString);
            current.setMinutes(current.getMinutes() + 15); // 15 min intervals
        }
        return groups;
    }, [place.openingTime, place.closingTime]);

    const totalSlots = timeSlots.morning.length + timeSlots.afternoon.length + timeSlots.evening.length;

    // Generate next 5 days
    const nextDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 0; i < 5; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    }, []);

    const formatDateLabel = (date: Date, index: number) => {
        if (index === 0) return { day: "Today", date: date.getDate() };
        if (index === 1) return { day: "Tmrw", date: date.getDate() };
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate()
        };
    };

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

    const COUNTERS = [
        { id: "counter-1", label: "General & Enquiry", icon: Info, color: "bg-blue-50 text-blue-600 border-blue-200" },
        { id: "counter-2", label: "Cash Deposit", icon: Banknote, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
        { id: "counter-3", label: "Loans & Forex", icon: Briefcase, color: "bg-violet-50 text-violet-600 border-violet-200" },
    ];

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={cn(
                "bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl z-10 overflow-hidden transform transition-all duration-500 flex flex-col max-h-[90vh]",
                isOpen ? "translate-y-0 scale-100" : "translate-y-8 scale-95"
            )}>
                {/* Header */}
                <div className="p-6 pb-2 bg-white z-10">
                    <div className="flex justify-between items-center mb-1">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Join Details</h2>
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-slate-500 font-medium">{place.name}</p>

                    {place.openingTime && place.closingTime && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 py-2 px-3 rounded-lg w-fit">
                            <Clock className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{place.openingTime} - {place.closingTime}</span>
                        </div>
                    )}
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-8 scrollbar-hide">
                    <form onSubmit={handleSubmit} id="join-form" className="space-y-6">

                        {/* Section: Counter */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Info className="w-3 h-3" /> Select Service
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {COUNTERS.map((c) => {
                                    const Icon = c.icon;
                                    const isSelected = formData.counter === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, counter: c.id }))}
                                            className={cn(
                                                "relative flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200 group",
                                                isSelected
                                                    ? `border-indigo-600 bg-indigo-50/50`
                                                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                                isSelected ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : c.color
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <div className={cn("font-bold text-base", isSelected ? "text-indigo-900" : "text-slate-700")}>
                                                    {c.label}
                                                </div>
                                                <div className="text-xs text-slate-400 font-medium mt-0.5">₹20 Service Charge</div>
                                            </div>
                                            {isSelected && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center animate-in zoom-in">
                                                    <Check className="w-3.5 h-3.5 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Section: Date */}
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <CalendarIcon className="w-3 h-3" /> Select Date
                            </label>

                            <div className="flex gap-3 overflow-x-auto pb-4 -mx-6 px-6 scrollbar-hide snap-x">
                                {nextDays.map((date, i) => {
                                    const dateStr = date.toISOString().split('T')[0];
                                    const isSelected = formData.preferredDate === dateStr;
                                    const { day, date: dateNum } = formatDateLabel(date, i);

                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, preferredDate: dateStr }))}
                                            className={cn(
                                                "min-w-[72px] h-[84px] rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all flex-shrink-0 snap-center",
                                                isSelected
                                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                                                    : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-slate-50"
                                            )}
                                        >
                                            <span className={cn("text-xs font-bold uppercase", isSelected ? "text-indigo-200" : "text-slate-400")}>
                                                {day}
                                            </span>
                                            <span className="text-2xl font-black">
                                                {dateNum}
                                            </span>
                                        </button>
                                    );
                                })}

                                {/* Custom Date Picker Trigger */}
                                <div className="relative min-w-[72px] h-[84px]">
                                    <input
                                        ref={datePickerRef}
                                        type="date"
                                        min={new Date().toISOString().split('T')[0]}
                                        onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
                                        className="invisible absolute inset-0 bottom-0 left-0 w-1 h-1"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => datePickerRef.current?.showPicker()}
                                        className={cn(
                                            "w-full h-full rounded-2xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-indigo-500 hover:border-indigo-200 transition-all",
                                            !nextDays.some(d => d.toISOString().split('T')[0] === formData.preferredDate) && formData.preferredDate
                                                ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                                                : ""
                                        )}
                                    >
                                        <CalendarIcon className="w-6 h-6" />
                                        <span className="text-xs font-bold">More</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section: Time */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Select Time
                                </label>
                                {formData.preferredDate && (
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
                                        {totalSlots} slots
                                    </span>
                                )}
                            </div>

                            {totalSlots > 0 ? (
                                <div className="space-y-6">
                                    {/* Morning */}
                                    {timeSlots.morning.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <Sun className="w-3 h-3 text-amber-500" /> Morning
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {timeSlots.morning.map(time => (
                                                    <TimeSlotButton
                                                        key={time}
                                                        time={time}
                                                        selected={formData.preferredTime === time}
                                                        onClick={() => setFormData(prev => ({ ...prev, preferredTime: time }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Afternoon */}
                                    {timeSlots.afternoon.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <SunMedium className="w-3 h-3 text-orange-500" /> Afternoon
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {timeSlots.afternoon.map(time => (
                                                    <TimeSlotButton
                                                        key={time}
                                                        time={time}
                                                        selected={formData.preferredTime === time}
                                                        onClick={() => setFormData(prev => ({ ...prev, preferredTime: time }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Evening */}
                                    {timeSlots.evening.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                                <Moon className="w-3 h-3 text-indigo-500" /> Evening
                                            </div>
                                            <div className="grid grid-cols-3 gap-2">
                                                {timeSlots.evening.map(time => (
                                                    <TimeSlotButton
                                                        key={time}
                                                        time={time}
                                                        selected={formData.preferredTime === time}
                                                        onClick={() => setFormData(prev => ({ ...prev, preferredTime: time }))}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-6 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                                    <p className="text-slate-400 text-sm font-medium">No slots available</p>
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-2 bg-white border-t border-slate-100 z-10">
                    <button
                        form="join-form"
                        type="submit"
                        disabled={isSubmitting || !formData.counter || !formData.preferredDate || !formData.preferredTime}
                        className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-indigo-200 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>Processing...</>
                        ) : (
                            <>
                                <span>Confirm & Pay ₹20</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function TimeSlotButton({ time, selected, onClick }: { time: string, selected: boolean, onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "py-3 px-1 rounded-xl text-sm font-bold border-2 transition-all duration-200",
                selected
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105"
                    : "bg-white border-slate-100 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/30"
            )}
        >
            {time}
        </button>
    );
}
