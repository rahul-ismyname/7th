"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const TicketsContext = createContext(undefined);

export function TicketsProvider({ children }) {
    const { user } = useAuth();
    const [activeTickets, setActiveTickets] = useState([]);
    const [historyTickets, setHistoryTickets] = useState([]);

    useEffect(() => {
        if (user) {
            fetchUserTickets(user.id);

            // Realtime subscription for tickets
            const ticketsSubscription = supabase
                .channel(`public:tickets:user:${user.id}`)
                .on('postgres_changes', {
                    event: '*',
                    schema: 'public',
                    table: 'tickets',
                    filter: `user_id=eq.${user.id}`
                }, payload => {
                    // Refresh everything on user ticket changes for simplicity
                    // or handle events specifically if needed
                    fetchUserTickets(user.id);
                })
                .subscribe();

            return () => {
                ticketsSubscription.unsubscribe();
            };
        } else {
            setActiveTickets([]);
            setHistoryTickets([]);
        }
    }, [user]);

    async function fetchUserTickets(userId) {
        // Fetch Active
        const { data: activeData } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['waiting', 'serving']);

        if (activeData) {
            setActiveTickets(activeData.map(t => ({
                placeId: t.place_id,
                ticketId: t.id,
                tokenNumber: t.token_number,
                estimatedWait: t.estimated_wait,
                timestamp: new Date(t.created_at).getTime(),
                status: t.status,
                counterId: t.counter_id
            })));
        }

        // Fetch History
        const { data: historyData } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(20);

        if (historyData) {
            setHistoryTickets(historyData.map(t => ({
                placeId: t.place_id,
                ticketId: t.id,
                tokenNumber: t.token_number,
                estimatedWait: t.estimated_wait,
                timestamp: new Date(t.created_at).getTime(),
                status: t.status
            })));
        }
    }

    const joinQueue = async (placeId, details) => {
        if (!user) return alert("Please login to join a queue.");

        const existingActiveTicket = activeTickets.find(t => t.status === 'waiting' || t.status === 'serving');
        if (existingActiveTicket) {
            return alert("You're already in a queue!");
        }

        const tokenNumber = Math.floor(Math.random() * 999) + 1;

        const { data, error } = await supabase
            .from('tickets')
            .insert({
                place_id: placeId,
                counter_id: details?.counterId,
                user_id: user.id,
                token_number: `#${tokenNumber}`,
                estimated_wait: details?.estimatedWait || 15,
                status: 'waiting',
                preferred_time: details?.preferredTime,
                preferred_date: details?.preferredDate
            })
            .select()
            .single();

        if (error) return alert(`Failed to join: ${error.message}`);

        // Optimistic update handled by realtime or manually
        if (data) fetchUserTickets(user.id);
    };

    const leaveQueue = async (placeId) => {
        const ticket = activeTickets.find(t => t.placeId === placeId);
        if (ticket) {
            await supabase.from('tickets')
                .update({ status: 'cancelled' })
                .eq('id', ticket.ticketId);
            fetchUserTickets(user.id);
        }
    };

    const completeTicket = async (ticketId) => {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'completed' })
            .eq('id', ticketId);

        if (error) {
            console.error("Error completing ticket:", error);
            throw error;
        }
        fetchUserTickets(user.id);
    };

    const submitReview = async (ticketId, data) => {
        const { submitReviewAction } = await import("@/actions/tickets");
        const result = await submitReviewAction(ticketId, data);
        if (!result.success) throw new Error(result.error);
    };

    const clearHistory = async () => {
        if (!user) return;
        await supabase.from('tickets')
            .delete()
            .eq('user_id', user.id)
            .in('status', ['completed', 'cancelled']);
        fetchUserTickets(user.id);
    };

    return (
        <TicketsContext.Provider value={{
            activeTickets,
            historyTickets,
            joinQueue,
            leaveQueue,
            submitReview,
            completeTicket,
            clearHistory,
            refreshHistory: () => user && fetchUserTickets(user.id)
        }}>
            {children}
        </TicketsContext.Provider>
    );
}

export function useTickets() {
    const context = useContext(TicketsContext);
    if (context === undefined) {
        throw new Error("useTickets must be used within a TicketsProvider");
    }
    return context;
}
