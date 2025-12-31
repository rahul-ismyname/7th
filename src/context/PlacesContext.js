"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PLACES as DEFAULT_PLACES } from "@/lib/data";
import { supabase } from "@/lib/supabase";

// Helper to map DB row to Place object
export const mapPlaceData = (p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    address: p.address,
    rating: Number(p.rating),
    distance: p.dist_meters ? `${(p.dist_meters / 1000).toFixed(1)} km` : '0.5 km',
    isApproved: p.is_approved,
    coordinates: { lat: p.lat, lng: p.lng },
    crowdLevel: p.crowd_level,
    liveWaitTime: p.live_wait_time,
    lastUpdated: p.last_updated ? new Date(p.last_updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
    queueLength: p.queue_length,
    currentServingToken: p.current_serving_token,
    estimatedTurnTime: p.estimated_turn_time,
    averageServiceTime: p.average_service_time || 5, // Default to 5
    counters: p.counters || [], // Map counters
});

const PlacesContext = createContext(undefined);

export function PlacesProvider({ children }) {
    const [places, setPlaces] = useState([]);
    const [nearbyPlaces, setNearbyPlaces] = useState([]);
    const [isPlacesLoaded, setIsPlacesLoaded] = useState(false);

    // Load Global Data
    const loadData = useCallback(async () => {
        try {
            const { data: placesData, error: placesError } = await supabase
                .from('places')
                .select('*, counters(*)')
                .eq('is_approved', true);

            if (placesError) {
                console.error("Error fetching places:", placesError);
                setPlaces(DEFAULT_PLACES);
            } else if (placesData && placesData.length > 0) {
                const mappedPlaces = placesData.map(mapPlaceData);
                setPlaces(mappedPlaces);
            } else {
                setPlaces(DEFAULT_PLACES);
            }
        } catch (e) {
            console.error("CRITICAL ERROR IN LOAD DATA:", e);
            setPlaces(DEFAULT_PLACES);
        } finally {
            setIsPlacesLoaded(true);
        }
    }, []);

    const fetchNearbyPlaces = useCallback(async (lat, lng, radiusKm = 5) => {
        try {
            const { data, error } = await supabase.rpc('get_nearby_places', {
                cur_lat: lat,
                cur_lng: lng,
                radius_km: radiusKm
            });

            if (error) {
                console.error("Error fetching nearby places:", error.message, error.details, error.hint);
                // Fallback to local filtering if RPC fails (e.g. function not created yet)
                return;
            }

            if (data) {
                setNearbyPlaces(data.map(mapPlaceData));
            }
        } catch (e) {
            console.error("Error in fetchNearbyPlaces:", e);
        }
    }, []);

    useEffect(() => {
        loadData();

        // Realtime subscription for places
        const placesSubscription = supabase
            .channel('public:places')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, payload => {
                // Refresh data to keep things simple and consistent with counters
                // Alternatively, patch local state if high performance is needed
                loadData();
            })
            .subscribe();

        return () => {
            placesSubscription.unsubscribe();
        };
    }, [loadData]);

    return (
        <PlacesContext.Provider value={{
            places,
            nearbyPlaces,
            isPlacesLoaded,
            fetchNearbyPlaces,
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
