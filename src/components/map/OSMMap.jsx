"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

// Component to handle map center updates
function MapUpdater({ selectedPlace }) {
    const map = useMap();

    useEffect(() => {
        if (selectedPlace) {
            map.flyTo([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 16, {
                duration: 1.5
            });
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

    const handleLocate = () => {
        map.locate().on("locationfound", function (e) {
            map.flyTo(e.latlng, map.getZoom());
            L.popup()
                .setLatLng(e.latlng)
                .setContent("You are here")
                .openOn(map);
        });
    };

    return (
        <div className="absolute bottom-6 right-6 z-[1000]">
            <button
                onClick={handleLocate}
                className="p-3 bg-white rounded-full shadow-xl hover:bg-slate-50 text-slate-700 transition-all border border-slate-200 active:scale-95 flex items-center justify-center group"
                title="Locate Me"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 group-hover:text-primary transition-colors"><line x1="12" x2="12" y1="2" y2="5" /><line x1="12" x2="12" y1="19" y2="22" /><line x1="2" x2="5" y1="12" y2="12" /><line x1="19" x2="22" y1="12" y2="12" /><circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="3" className="fill-current opacity-0 group-hover:opacity-100 transition-opacity" /></svg>
            </button>
        </div>
    );
}

// Component to handle efficient marker rendering
function PlacesLayer({
    places,
    onSelectPlace,
    onMapMoveEnd
}) {
    const map = useMap();
    const [visiblePlaces, setVisiblePlaces] = useState([]);

    // Function to update visible places based on bounds and zoom
    const updateVisibility = () => {
        // Fallback: If we have few places, just show them all to avoid visibility bugs
        if (places.length <= 20) {
            setVisiblePlaces(places);
            return;
        }

        const zoom = map.getZoom();
        const bounds = map.getBounds();

        // Optimization 1: Hide all if zoomed out too far (World/City view)
        if (zoom < 13) {
            setVisiblePlaces([]);
            return;
        }

        // Optimization 2: Only show places within current view
        const inView = places.filter(p =>
            bounds.contains([p.coordinates.lat, p.coordinates.lng])
        );

        // Optimization 3: Limit to max 20 to prevent rendering lag
        setVisiblePlaces(inView.slice(0, 20));
    };

    // Listen for map movements
    useMapEvents({
        moveend: () => {
            // Notify parent of new center when user stops moving map
            if (onMapMoveEnd) {
                const center = map.getCenter();
                onMapMoveEnd(center.lat, center.lng);
            }
            updateVisibility();
        },
        zoomend: updateVisibility,
    });

    // Initial load
    useEffect(() => {
        updateVisibility();
    }, [places]); // Re-run if places data changes (e.g. search)

    return (
        <>
            {visiblePlaces.map((place) => (
                <Marker
                    key={place.id}
                    position={[place.coordinates.lat, place.coordinates.lng]}
                    icon={createCustomIcon(place.type, false)}
                    eventHandlers={{
                        click: () => onSelectPlace(place.id),
                        popupclose: () => onSelectPlace("")
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
                                    {place.liveWaitTime}m Wait
                                </span>
                            )}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
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
