"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PLACES as DEFAULT_PLACES } from "@/lib/data";
import { supabase } from "@/lib/supabase";

// Helper to map DB row to Place object
export const mapPlaceData = (p) => {
    const d = p.dist_meters ? p.dist_meters / 1000 : 0.5; // distance in km
    return {
        id: p.id,
        name: p.name,
        type: p.type,
        address: p.address,
        rating: Number(p.rating),
        distanceValue: d,
        distanceDisplay: d < 1 ? `${Math.round(d * 1000)}m` : `${d.toFixed(1)}km`,
        relevanceScore: p.relevance_score || 0,
        isApproved: p.is_approved,
        coordinates: { lat: p.lat, lng: p.lng },
        crowdLevel: p.crowd_level,
        liveWaitTime: p.live_wait_time,
        lastUpdated: p.last_updated ? new Date(p.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        queueLength: p.queue_length,
        currentServingToken: p.current_serving_token,
        estimatedTurnTime: p.estimated_turn_time,
        averageServiceTime: p.average_service_time || 5,
        counters: p.counters || [],
        ownerId: p.owner_id,
    };
};

const PlacesContext = createContext(undefined);

export function PlacesProvider({ children }) {
    const [places, setPlaces] = useState([]);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [isPlacesLoaded, setIsPlacesLoaded] = useState(false);

    // Load Global Data - REMOVED for Scalability
    // We now rely on viewport-based fetching (fetchNearbyPlaces)
    // and on-demand fetching (fetchPlaceById)
    const loadData = useCallback(async () => {
        setIsPlacesLoaded(true);
    }, []);

    const fetchNearbyPlaces = useCallback(async (lat, lng, radiusKm = 5, searchQuery = null) => {
        try {
            console.log("Fetching nearby places:", { lat, lng, radiusKm, searchQuery });
            const { data, error } = await supabase.rpc('get_nearby_places', {
                cur_lat: lat,
                cur_lng: lng,
                radius_km: radiusKm,
                search_term: searchQuery
            });

            if (error) {
                console.error("Error fetching nearby places:", error.message, error.details, error.hint);
                return;
            }

            console.log("RPC Data received:", data?.length || 0, "results");

            if (data) {
                const newPlaces = data.map(mapPlaceData);
                setNearbyPlaces(newPlaces);

                // Add to global cache (avoid duplicates)
                setPlaces(prev => {
                    const cache = new Map(prev.map(p => [p.id, p]));
                    newPlaces.forEach(p => cache.set(p.id, p));
                    return Array.from(cache.values());
                });
            }
        } catch (e) {
            console.error("Error in fetchNearbyPlaces:", e);
        }
    }, []);

    const fetchPlaceById = useCallback(async (placeId) => {
        const { data, error } = await supabase
            .from('places')
            .select('*, counters(*)')
            .eq('id', placeId)
            .single();

        if (data) {
            const mapped = mapPlaceData(data);
            setPlaces(prev => {
                const cache = new Map(prev.map(p => [p.id, p]));
                cache.set(mapped.id, mapped);
                return Array.from(cache.values());
            });
            return mapped;
        }
        return null;
    }, []);

    const updatePlace = useCallback((placeId, newData) => {
        // Optimistically update local state
        setPlaces(prev => prev.map(p => p.id === placeId ? { ...p, ...mapPlaceData({ ...p, ...newData }) } : p));
        setNearbyPlaces(prev => prev.map(p => p.id === placeId ? { ...p, ...mapPlaceData({ ...p, ...newData }) } : p));
    }, []);

    useEffect(() => {
        loadData();

        // Realtime subscription for places
        // Global Realtime subscription REMOVED to prevent "Firehose" issue.
        // Components must subscribe to specific places using updatePlace.

        return () => {
            // Cleanup if needed
        };
    }, [loadData]);

    return (
        <PlacesContext.Provider value={{
            places,
            nearbyPlaces,
            isPlacesLoaded,
            fetchNearbyPlaces,
            fetchPlaceById,
            updatePlace,
            refreshPlaces: loadData
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
