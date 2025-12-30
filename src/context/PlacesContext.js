"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { PLACES as DEFAULT_PLACES } from "@/lib/data";
import { supabase } from "@/lib/supabase";

// Helper to map DB row to Place object
const mapPlaceData = (p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    address: p.address,
    rating: Number(p.rating),
    distance: '0.5 km',
    isApproved: p.is_approved,
    coordinates: { lat: p.lat, lng: p.lng },
    crowdLevel: p.crowd_level,
    liveWaitTime: p.live_wait_time,
    lastUpdated: p.last_updated ? new Date(p.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    queueLength: p.queue_length,
    currentServingToken: p.current_serving_token,
    estimatedTurnTime: p.estimated_turn_time,
    averageServiceTime: p.average_service_time || 5, // Default to 5
});

const PlacesContext = createContext(undefined);

export function PlacesProvider({ children }) {
    const [user, setUser] = useState(null);
    const [places, setPlaces] = useState([]);
    const [vendorPlaces, setVendorPlaces] = useState([]);
    const [activeTickets, setActiveTickets] = useState([]);
    const [historyTickets, setHistoryTickets] = useState([]); // New State
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // 1. Auth Listener (Runs Once)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            (event, session) => {
                setUser(session?.user || null);
            }
        );

        // 2. Load Global Data
        async function loadData() {
            try {
                const { data: placesData, error: placesError } = await supabase
                    .from('places')
                    .select('*')
                    .eq('is_approved', true); // ONLY APPROVED PLACES VISIBLE

                if (placesError) {
                    console.error("Error fetching places (Full):", placesError);
                    console.error("Error Message:", placesError.message);
                    console.error("Error Details:", placesError.details);
                    console.error("Error Hint:", placesError.hint);
                    setPlaces(DEFAULT_PLACES);
                } else if (placesData && placesData.length > 0) {
                    console.log("PlacesContext: Loaded DB Places:", placesData.length);
                    const mappedPlaces = placesData.map(mapPlaceData);
                    setPlaces(mappedPlaces);
                } else {
                    console.warn("PlacesContext: No DB Places found, using defaults.");
                    setPlaces(DEFAULT_PLACES);
                }
            } catch (e) {
                console.error("CRITICAL ERROR IN LOAD DATA:", e);
                setPlaces(DEFAULT_PLACES);
            } finally {
                setIsLoaded(true);
            }
        }

        loadData();

        // Realtime subscription for tickets
        const ticketsSubscription = supabase
            .channel('public:tickets')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, payload => {
                // If needed, trigger fetches. Since we can't easily access 'user' inside this closure 
                // without adding it to dependency (causing loop), we rely on the helper functions or 
                // global event bus. For simplest fix: we won't refetch user tickets here immediately
                // unless we refactor to use refs. 
                // actually, we can trigger a "refresh signal" if we wanted.
            })
            .subscribe();

        // Realtime subscription for places (OPTIMIZED)
        const placesSubscription = supabase
            .channel('public:places')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, payload => {
                // Optimistic Updates: Modify local state directly instead of re-fetching
                if (payload.eventType === 'INSERT') {
                    // Only add if approved
                    if (payload.new.is_approved) {
                        const newPlace = mapPlaceData(payload.new);
                        setPlaces(prev => [...prev, newPlace]);
                    }
                } else if (payload.eventType === 'UPDATE') {
                    // Handle Approval Change (Hidden -> Visible or Visible -> Hidden)
                    // Note: We might not get 'old' values for all columns, but 'new' has current state
                    if (payload.new.is_approved === false) {
                        // If updated to be unapproved, remove it
                        setPlaces(prev => prev.filter(p => p.id !== payload.new.id));
                    } else {
                        // Normal update or newly approved
                        const updatedPlace = mapPlaceData(payload.new);
                        setPlaces(prev => {
                            const exists = prev.find(p => p.id === updatedPlace.id);
                            if (exists) {
                                return prev.map(p => p.id === updatedPlace.id ? updatedPlace : p);
                            } else {
                                return [...prev, updatedPlace];
                            }
                        });
                    }
                } else if (payload.eventType === 'DELETE') {
                    setPlaces(prev => prev.filter(p => p.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            authListener.subscription.unsubscribe();
            ticketsSubscription.unsubscribe();
            placesSubscription.unsubscribe();
        };
    }, []); // Empty dependency array - Runs ONCE on mount

    // 3. User Data Effect - Runs when user changes
    useEffect(() => {
        if (user) {
            fetchUserTickets(user.id);
            fetchVendorPlaces(user.id);
        } else {
            setActiveTickets([]);
            setHistoryTickets([]);
            setVendorPlaces([]);
        }
    }, [user]);

    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white text-slate-800">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="font-bold animate-pulse">Initializing Waitly...</p>
                </div>
            </div>
        );
    }

    /* 
       Let's keep the existing realtime logic for Active tickets high-performance updates.
       For History, we can just fetch it on mount/auth and maybe refresh if user requests.
    */

    async function fetchUserTickets(userId) {
        // 1. Fetch Active
        const { data: activeData, error: activeError } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['waiting', 'serving']);

        if (activeError) console.error("Error fetching active tickets:", activeError);
        console.log("PlacesContext: Active tickets found:", activeData?.length || 0);

        if (activeData) {
            const mappedActive = activeData.map((t) => ({
                placeId: t.place_id,
                ticketId: t.id,
                tokenNumber: t.token_number,
                estimatedWait: t.estimated_wait,
                timestamp: new Date(t.created_at).getTime(),
                status: t.status
            }));
            setActiveTickets(mappedActive);
        }

        // 2. Fetch History (Limit 20 for now)
        const { data: historyData, error: historyError } = await supabase
            .from('tickets')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['completed', 'cancelled'])
            .order('created_at', { ascending: false })
            .limit(20);

        if (historyError) console.error("Error fetching history:", historyError);
        console.log("PlacesContext: History tickets found:", historyData?.length || 0);

        if (historyData) {
            const mappedHistory = historyData.map((t) => ({
                placeId: t.place_id,
                ticketId: t.id,
                tokenNumber: t.token_number,
                estimatedWait: t.estimated_wait,
                timestamp: new Date(t.created_at).getTime(),
                status: t.status
            }));
            setHistoryTickets(mappedHistory);
        }
    };

    const refreshHistory = () => {
        if (user) fetchUserTickets(user.id);
    };

    async function fetchVendorPlaces(userId) {
        const { data: placesData, error } = await supabase
            .from('places')
            .select('*')
            .eq('owner_id', userId);

        if (error) {
            console.error("Error fetching vendor places (Full):", error);
            console.error("Vendor Error Message:", error.message);
            console.error("Vendor Error Details:", error.details);
            console.error("Vendor Error Hint:", error.hint);
            return;
        }

        if (placesData) {
            const mappedPlaces = placesData.map((p) => ({
                id: p.id,
                name: p.name,
                type: p.type,
                address: p.address,
                rating: Number(p.rating),
                distance: '0.5 km',
                isApproved: p.is_approved,
                coordinates: { lat: p.lat, lng: p.lng },
                crowdLevel: p.crowd_level,
                liveWaitTime: p.live_wait_time,
                lastUpdated: p.last_updated ? new Date(p.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
                queueLength: p.queue_length,
                currentServingToken: p.current_serving_token,
                estimatedTurnTime: p.estimated_turn_time,
            }));
            setVendorPlaces(mappedPlaces);
        }
    };

    // Vendor Actions
    const updateTicketStatus = async (ticketId, status) => {
        const { error } = await supabase
            .from('tickets')
            .update({ status })
            .eq('id', ticketId);

        if (error) {
            console.error("Error updating ticket:", error);
            alert("Failed to update ticket status");
        }
        // Realtime will update the local state
    };

    const callNextTicket = async (placeId, tokenNumber) => {
        // 1. Update the PLACE's current serving token
        const { error: placeError } = await supabase
            .from('places')
            .update({
                current_serving_token: tokenNumber,
            })
            .eq('id', placeId);

        if (placeError) console.error("Error updating place:", placeError);
    };

    const markNoShow = async (ticketId) => {
        const { error } = await supabase
            .from('tickets')
            .update({ status: 'cancelled' }) // or 'skipped', but schema uses cancelled for now
            .eq('id', ticketId);

        if (error) {
            console.error("Error marking no-show:", error);
            return;
        }

        setActiveTickets(prev => prev.filter(t => t.ticketId !== ticketId));
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

        // Optimistic update
        const ticket = activeTickets.find(t => t.ticketId === ticketId);
        if (ticket) {
            setActiveTickets(prev => prev.filter(t => t.ticketId !== ticketId));
        }
    };

    const submitReview = async (ticketId, data) => {
        // Dynamic import of Server Action to avoid bundling issues
        const { submitReviewAction } = await import("@/actions/tickets");

        const result = await submitReviewAction(ticketId, data);

        if (!result.success) {
            console.error("Error submitting review:", result.error);
            throw new Error(result.error);
        }

        // Success! Realtime subscription will receive the updated Place average time automatically.
    };

    const toggleQueueStatus = async (placeId, isOpen) => {
        // We use is_approved to mean "Open/Active". 
        // If false, it means "Closed/Offline" in our simple logic.
        const { error } = await supabase
            .from('places')
            .update({ is_approved: isOpen })
            .eq('id', placeId);

        if (error) {
            console.error("Error updating queue status:", error);
            alert("Failed to update queue status");
        } else {
            // Optimistic or wait for realtime
            alert(isOpen ? "Queue is now OPEN" : "Queue is now CLOSED");
        }
    };

    const addPlace = async (place) => {
        if (!user) {
            alert("You must be logged in to add a place.");
            return;
        }

        const { error } = await supabase
            .from('places')
            .insert([{
                name: place.name,
                type: place.type,
                address: place.address,
                rating: place.rating,
                is_approved: false, // FORCE FALSE: Requires Admin Approval to go live
                lat: place.coordinates.lat,
                lng: place.coordinates.lng,
                live_wait_time: place.liveWaitTime,
                crowd_level: place.crowdLevel,
                owner_id: user.id, // Set the owner!
                average_service_time: place.averageServiceTime || 5
            }]);

        if (error) {
            console.error("Error adding place (Full):", error);
            console.error("Message:", error.message);
            console.error("Details:", error.details);
            console.error("Hint:", error.hint);
            alert("Failed to add place: " + error.message);
        } else {
            // Success!
            alert("Business Registered Successfully!");
            // Refresh vendor list immediately
            fetchVendorPlaces(user.id);
        }
    };

    const removePlace = async (id) => {
        if (!user) return;

        // Optimistic update
        setPlaces((prev) => prev.filter((p) => p.id !== id));
        setVendorPlaces((prev) => prev.filter((p) => p.id !== id));

        const { error } = await supabase
            .from('places')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error deleting place:", error);
            alert("Failed to delete business: " + error.message);
            // Revert would be needed here in a perfect world, but for now we just alert
            fetchVendorPlaces(user.id); // Sync back
        }
    };

    const resetPlaces = () => {
        setPlaces(DEFAULT_PLACES);
        setActiveTickets([]);
    };

    const joinQueue = async (placeId, details) => {
        if (!user) {
            alert("Please login to join a queue.");
            // Ideally redirect or show auth modal
            return;
        }

        // Check if user already has an active ticket (ANY queue)
        const existingActiveTicket = activeTickets.find(t => t.status === 'waiting' || t.status === 'serving');
        if (existingActiveTicket) {
            alert("You're already in a queue! Please complete or cancel your current ticket before joining another.");
            return;
        }

        const place = places.find(p => p.id === placeId);
        if (!place) return;

        const tokenNumber = Math.floor(Math.random() * 999) + 1;

        const { data, error } = await supabase
            .from('tickets')
            .insert({
                place_id: placeId,
                user_id: user.id, // Link to User
                token_number: `#${tokenNumber}`,
                estimated_wait: place.liveWaitTime || 15,
                status: 'waiting',
                counter: details?.counter,
                preferred_time: details?.preferredTime,
                preferred_date: details?.preferredDate
            })
            .select()
            .single();

        if (error) {
            console.error("Failed to join queue:", error);
            alert(`Failed to join queue: ${error.message}`);
            return;
        }

        // Optimistic / Immediate Update
        if (data) {
            const newTicket = {
                placeId: data.place_id,
                ticketId: data.id,
                tokenNumber: data.token_number,
                estimatedWait: data.estimated_wait,
                timestamp: new Date(data.created_at).getTime(),
                status: data.status
            };
            setActiveTickets(prev => [...prev, newTicket]);
        }
    };

    const leaveQueue = async (placeId) => {
        const ticket = activeTickets.find(t => t.placeId === placeId);

        // Optimistic UI update
        setActiveTickets(prev => prev.filter(t => t.placeId !== placeId));

        if (ticket) {
            await supabase.from('tickets')
                .update({ status: 'cancelled' })
                .eq('id', ticket.ticketId);
        }
    };

    const clearHistory = async () => {
        if (!user) return;

        // Optimistic
        setHistoryTickets([]);

        const { error } = await supabase
            .from('tickets')
            .delete()
            .eq('user_id', user.id)
            .in('status', ['completed', 'cancelled']);

        if (error) {
            console.error("Error clearing history:", error);
            refreshHistory(); // Revert
        }
    };

    if (!isLoaded) {
        return null;
    }

    return (
        <PlacesContext.Provider value={{
            user,
            places,
            vendorPlaces, // Added
            activeTickets,
            historyTickets, // Added
            addPlace,
            removePlace,
            resetPlaces: () => { }, // No-op for now in realtime mode
            joinQueue,
            leaveQueue,
            updateTicketStatus,
            callNextTicket,
            markNoShow,
            completeTicket,
            submitReview,
            toggleQueueStatus,
            clearHistory,
            signOut: async () => { await supabase.auth.signOut(); },
            refreshHistory
        }}>
            {children}
        </PlacesContext.Provider>
    );
}

export function usePlaces() {
    const context = useContext(PlacesContext);
    if (context === undefined) {
        throw new Error("usePlaces must be used within a PlacesProvider");
    }
    return context;
}
