import React from "react";
import { X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function CancelTicketModal({ isOpen, onClose, onConfirm, placeName, ticketNumber }) {
    if (!isOpen) return null;

    return (
        <div className={cn(
            "fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 transition-all duration-300",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-500"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className={cn(
                "bg-white w-full max-w-sm rounded-[2rem] shadow-2xl z-10 overflow-hidden transform transition-all duration-500 flex flex-col relative animate-in slide-in-from-bottom-10 sm:zoom-in-95",
            )}>
                <div className="p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-6 border border-rose-100">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-2">Cancel Ticket?</h2>
                    <p className="text-slate-500 font-medium text-sm leading-relaxed mb-6">
                        Are you sure you want to leave the queue for <span className="text-slate-900 font-bold">{placeName}</span>?
                        <br /><br />
                        You will lose your spot (Token <span className="font-bold text-slate-900">{ticketNumber}</span>) and will need to rejoin from the back of the line.
                    </p>

                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={onConfirm}
                            className="w-full bg-rose-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-rose-200 active:scale-[0.98] hover:bg-rose-600 transition-all"
                        >
                            Yes, Cancel Ticket
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-slate-100 text-slate-700 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]"
                        >
                            No, Keep My Spot
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
