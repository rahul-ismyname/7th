"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar as CalendarIcon, Clock, Sun, Moon, SunMedium } from "lucide-react";
import { cn } from "@/lib/utils";

export function JoinQueueModal({ isOpen, onClose, place, onConfirm, initialCounterId }) {
    const datePickerRef = useRef(null);
    const [formData, setFormData] = useState({
        preferredTime: "",
        preferredDate: new Date().toISOString().split('T')[0]
    });

    // Counter Name for display
    const counterName = useMemo(() => {
        if (!initialCounterId || !place.counters) return "General Queue";
        const c = place.counters.find(c => c.id === initialCounterId);
        return c ? c.name : "General Queue";
    }, [place.counters, initialCounterId]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    const timeSlots = useMemo(() => {
        const start = place.openingTime || "09:00";
        const end = place.closingTime || "21:00";
        const groups = {
            morning: [],
            afternoon: [],
            evening: []
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

    const formatDateLabel = (date, index) => {
        if (index === 0) return { day: "Today", date: date.getDate() };
        if (index === 1) return { day: "Tmrw", date: date.getDate() };
        return {
            day: date.toLocaleDateString('en-US', { weekday: 'short' }),
            date: date.getDate()
        };
    };

    // Auto-select first slot
    useEffect(() => {
        if (isOpen && totalSlots > 0 && !formData.preferredTime) {
            if (timeSlots.morning.length) setFormData(prev => ({ ...prev, preferredTime: timeSlots.morning[0] }));
            else if (timeSlots.afternoon.length) setFormData(prev => ({ ...prev, preferredTime: timeSlots.afternoon[0] }));
            else if (timeSlots.evening.length) setFormData(prev => ({ ...prev, preferredTime: timeSlots.evening[0] }));
        }
    }, [isOpen, totalSlots, formData.preferredTime, timeSlots]);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setIsSubmitting(true);
        try {
            const dataToSubmit = {
                ...formData,
                counter: initialCounterId,
                counterId: initialCounterId === "default" ? null : initialCounterId
            };
            await onConfirm(dataToSubmit);
            onClose();
        } catch (error) {
            console.error("Error joining queue:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    if (!mounted || !isOpen) return null; // Don't render until client-side & open

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 transform-none", // transform-none is key
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
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Select Time</h2>
                            <p className="text-slate-500 text-sm font-medium">for {counterName}</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Form Area */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-8 scrollbar-hide">

                    {/* Date Selection */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3" /> Date
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide snap-x">
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
                                            "min-w-[64px] h-[76px] rounded-2xl flex flex-col items-center justify-center gap-1 border-2 transition-all flex-shrink-0 snap-center",
                                            isSelected
                                                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200 scale-105"
                                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                        )}
                                    >
                                        <span className={cn("text-[10px] font-bold uppercase", isSelected ? "text-slate-400" : "text-slate-400")}>
                                            {day}
                                        </span>
                                        <span className="text-xl font-black">
                                            {dateNum}
                                        </span>
                                    </button>
                                );
                            })}
                            {/* Picker */}
                            <div className="relative min-w-[64px] h-[76px]">
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
                                    className="w-full h-full rounded-2xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600 hover:border-slate-300 transition-all"
                                >
                                    <CalendarIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="w-full h-px bg-slate-100" />

                    {/* Time Selection - Grid Layout */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Time Slots
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
                                        <div className="grid grid-cols-4 gap-2">
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
                                        <div className="grid grid-cols-4 gap-2">
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
                                        <div className="grid grid-cols-4 gap-2">
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
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-2 bg-white border-t border-slate-100 z-10">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !formData.preferredDate || !formData.preferredTime}
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
        </div>,
        document.body
    );
}

function TimeSlotButton({ time, selected, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "py-2 px-1 rounded-xl text-xs font-bold border transition-all duration-200 whitespace-nowrap",
                selected
                    ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200"
                    : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            )}
        >
            {time}
        </button>
    );
}
