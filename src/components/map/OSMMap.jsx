"use client";

import { useEffect, useState, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Fix Leaflet's default icon issue in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const createCustomIcon = (type, isSelected) => {
    const color = isSelected ? '#4f46e5' : '#64748b';
    const size = isSelected ? 48 : 32;

    return L.divIcon({
        className: 'custom-marker',
        html: `
            <div style="
                background-color: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: 50% 50% 50% 0;
                transform: rotate(-45deg);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                border: 3px solid white;
                transition: all 0.3s ease;
            ">
                <div style="
                    width: ${size / 2.5}px;
                    height: ${size / 2.5}px;
                    background-color: white;
                    border-radius: 50%;
                    transform: rotate(45deg);
                "></div>
            </div>
        `,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size]
    });
};
function MapUpdater({ selectedPlace }) {
    const map = useMap();
    const lastFlownId = useRef(null);

    useEffect(() => {
        // Only fly if a new place is selected
        if (selectedPlace && selectedPlace.id !== lastFlownId.current) {
            map.flyTo([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 16, {
                duration: 1.5
            });
            lastFlownId.current = selectedPlace.id;
        }

        // Reset if selection is cleared
        if (!selectedPlace) {
            lastFlownId.current = null;
        }
    }, [selectedPlace, map]);

    return null;
}

// Component to handle map clicks
function MapClickHandler({ onDoubleClick }) {
    useMapEvents({
        dblclick: (e) => {
            if (onDoubleClick) {
                onDoubleClick(e.latlng.lat, e.latlng.lng);
            }
        },
    });
    return null;
}

// Component to locate user
function LocateUser() {
    const map = useMap();
    const [isLocating, setIsLocating] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const onLocationFound = (e) => {
            setIsLocating(false);
            setHasError(false);
            map.flyTo(e.latlng, 16);
            L.popup()
                .setLatLng(e.latlng)
                .setContent("You are here")
                .openOn(map);
        };

        const onLocationError = (e) => {
            setIsLocating(false);
            setHasError(true);


            // Reset error state after 3 seconds
            setTimeout(() => setHasError(false), 3000);
        };

        map.on('locationfound', onLocationFound);
        map.on('locationerror', onLocationError);

        return () => {
            map.off('locationfound', onLocationFound);
            map.off('locationerror', onLocationError);
        };
    }, [map]);

    const handleLocate = () => {
        setIsLocating(true);
        setHasError(false);
        map.locate({ setView: false, enableHighAccuracy: true });
    };

    return (
        <div className="absolute bottom-24 md:bottom-6 right-6 z-[1000]">
            <button
                onClick={handleLocate}
                disabled={isLocating}
                className={cn(
                    "p-3 rounded-full shadow-xl transition-all border flex items-center justify-center group relative overflow-hidden",
                    // Default State
                    "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-95",
                    // Loading State
                    isLocating && "ring-4 ring-indigo-100 text-indigo-600 border-indigo-200 cursor-wait",
                    // Error State
                    hasError && "bg-red-50 text-red-600 border-red-200 ring-4 ring-red-100"
                )}
                title="Locate Me"
            >
                {isLocating ? (
                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={cn(
                            "w-5 h-5 transition-colors",
                            hasError ? "text-red-600" : "group-hover:text-indigo-600"
                        )}
                    >
                        <line x1="12" x2="12" y1="2" y2="5" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                        <line x1="2" x2="5" y1="12" y2="12" />
                        <line x1="19" x2="22" y1="12" y2="12" />
                        <circle cx="12" cy="12" r="7" />
                        <circle
                            cx="12"
                            cy="12"
                            r="3"
                            className={cn(
                                "fill-current transition-opacity",
                                hasError ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                            )}
                        />
                    </svg>
                )}
            </button>
        </div>
    );
}

import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

// Component to handle efficient marker rendering
function PlacesLayer({
    places,
    onSelectPlace,
    onMapMoveEnd
}) {
    const map = useMap();
    const [visiblePlaces, setVisiblePlaces] = useState([]);

    // Function to update visible places based on bounds
    const updateVisibility = () => {
        const bounds = map.getBounds();

        // Only show places within current view + small buffer
        const buffer = 0.5; // Padding for smoother panning
        const inView = places.filter(p => {
            const lat = p.coordinates.lat;
            const lng = p.coordinates.lng;
            return lat > bounds.getSouth() - buffer &&
                lat < bounds.getNorth() + buffer &&
                lng > bounds.getWest() - buffer &&
                lng < bounds.getEast() + buffer;
        });

        // Optimization: Even with clustering, don't render more than 400 markers physically
        // This keeps the DOM light while the clusterer handles the visual grouping
        setVisiblePlaces(inView.slice(0, 400));
    };

    // Listen for map movements
    useMapEvents({
        moveend: () => {
            if (onMapMoveEnd) {
                const center = map.getCenter();
                onMapMoveEnd(center.lat, center.lng);
            }
            updateVisibility();
        },
        zoomend: updateVisibility,
    });

    // Initial load and when data changes
    useEffect(() => {
        updateVisibility();
    }, [places]);

    return (
        <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            disableClusteringAtZoom={17}
        >
            {visiblePlaces.map((place) => (
                <Marker
                    key={place.id}
                    position={[place.coordinates.lat, place.coordinates.lng]}
                    icon={createCustomIcon(place.type, false)}
                    eventHandlers={{
                        click: () => onSelectPlace(place.id),
                    }}
                >
                    <Popup>
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <h3 className="font-bold text-sm text-slate-800">{place.name}</h3>
                            <p className="text-xs text-slate-500 m-0">{place.address}</p>
                            {place.isApproved ? (
                                <span className="text-xs text-emerald-600 font-semibold mt-1">
                                    Virtual Queue Available
                                </span>
                            ) : (
                                <span className="text-xs text-amber-600 font-semibold mt-1">
                                    Approx Wait: {place.liveWaitTime}m
                                </span>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MarkerClusterGroup>
    );
}

export default function OSMMap({ places, selectedPlaceId, onSelectPlace, onMapDoubleClick, onMapMoveEnd }) {
    const defaultCenter = [28.6328, 77.2197]; // CP Delhi
    const selectedPlace = places.find(p => p.id === selectedPlaceId);

    return (
        <MapContainer
            center={defaultCenter}
            zoom={15}
            className="w-full h-full z-0"
            zoomControl={false}
            doubleClickZoom={!onMapDoubleClick} // Disable zoom if we have a handler
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater selectedPlace={selectedPlace} />
            <MapClickHandler onDoubleClick={onMapDoubleClick} />
            <LocateUser />

            {/* Optimized Marker Layer */}
            <PlacesLayer
                places={places}
                onSelectPlace={onSelectPlace}
                onMapMoveEnd={onMapMoveEnd}
            />
        </MapContainer>
    );
}
