"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./AuthContext";

const VendorContext = createContext(undefined);

export function VendorProvider({ children }) {
    const { user } = useAuth();
    const [vendorPlaces, setVendorPlaces] = useState([]);

    useEffect(() => {
        if (user) {
            fetchVendorPlaces(user.id);
        } else {
            setVendorPlaces([]);
        }
    }, [user]);

    async function fetchVendorPlaces(userId) {
        const { data: placesData, error } = await supabase
            .from('places')
            .select('*, counters(*)')
            .eq('owner_id', userId);

        if (error) {
            console.error("Error fetching vendor places:", error);
            return;
        }

        if (placesData) {
            setVendorPlaces(placesData.map(p => ({
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
                counters: p.counters || []
            })));
        }
    }

    const addCounter = async (placeId, counterData) => {
        const { data, error } = await supabase
            .from('counters')
            .insert([{
                place_id: placeId,
                name: counterData.name,
                average_service_time: counterData.avgServiceTime,
                opening_time: counterData.openingTime,
                closing_time: counterData.closingTime
            }])
            .select()
            .single();

        if (data) fetchVendorPlaces(user.id);
        return data;
    };

    const deleteCounter = async (counterId, placeId) => {
        const { error } = await supabase
            .from('counters')
            .delete()
            .eq('id', counterId);

        if (!error) fetchVendorPlaces(user.id);
    };

    const updateTicketStatus = async (ticketId, status) => {
        await supabase.from('tickets').update({ status }).eq('id', ticketId);
    };

    const callNextTicket = async (placeId, tokenNumber) => {
        await supabase.from('places').update({ current_serving_token: tokenNumber }).eq('id', placeId);
        fetchVendorPlaces(user.id);
    };

    const markNoShow = async (ticketId) => {
        await supabase.from('tickets').update({ status: 'cancelled' }).eq('id', ticketId);
    };

    const completeTicket = async (ticketId) => {
        const { error } = await supabase.from('tickets').update({ status: 'completed' }).eq('id', ticketId);
        if (error) throw error;
    };

    const toggleQueueStatus = async (placeId, isOpen) => {
        await supabase.from('places').update({ is_approved: isOpen }).eq('id', placeId);
        fetchVendorPlaces(user.id);
    };

    const addPlace = async (place) => {
        if (!user) return;
        const { data, error } = await supabase
            .from('places')
            .insert([{
                name: place.name,
                type: place.type,
                address: place.address,
                rating: place.rating,
                is_approved: false,
                lat: place.coordinates.lat,
                lng: place.coordinates.lng,
                live_wait_time: place.liveWaitTime,
                crowd_level: place.crowdLevel,
                owner_id: user.id,
                average_service_time: place.averageServiceTime || 5
            }])
            .select()
            .single();

        if (data) {
            await supabase.from('counters').insert({
                place_id: data.id,
                name: "Main Counter",
                average_service_time: place.averageServiceTime || 5,
                opening_time: "09:00",
                closing_time: "17:00"
            });
            fetchVendorPlaces(user.id);
        }
    };

    const removePlace = async (id) => {
        if (!user) return;
        await supabase.from('places').delete().eq('id', id);
        fetchVendorPlaces(user.id);
    };

    return (
        <VendorContext.Provider value={{
            vendorPlaces,
            addPlace,
            addCounter,
            deleteCounter,
            removePlace,
            updateTicketStatus,
            callNextTicket,
            markNoShow,
            completeTicket,
            toggleQueueStatus
        }}>
            {children}
        </VendorContext.Provider>
    );
}

export function useVendor() {
    const context = useContext(VendorContext);
    if (context === undefined) {
        throw new Error("useVendor must be used within a VendorProvider");
    }
    return context;
}
