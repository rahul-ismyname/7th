"use client";

import { useEffect } from "react";
import { Place } from "@/lib/data";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon issue in Next.js
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

const customIcon = new L.Icon({
    iconUrl,
    iconRetinaUrl,
    shadowUrl,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Component to handle map center updates
function MapUpdater({ selectedPlace }: { selectedPlace?: Place }) {
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
function MapClickHandler({ onDoubleClick }: { onDoubleClick?: (lat: number, lng: number) => void }) {
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

interface OSMMapProps {
    places: Place[];
    selectedPlaceId?: string;
    onSelectPlace: (id: string) => void;
    onMapDoubleClick?: (lat: number, lng: number) => void;
}

export default function OSMMap({ places, selectedPlaceId, onSelectPlace, onMapDoubleClick }: OSMMapProps) {
    const defaultCenter: [number, number] = [28.6328, 77.2197]; // CP Delhi
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
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <MapUpdater selectedPlace={selectedPlace} />
            <MapClickHandler onDoubleClick={onMapDoubleClick} />
            <LocateUser />

            {places.map((place) => (
                <Marker
                    key={place.id}
                    position={[place.coordinates.lat, place.coordinates.lng]}
                    icon={customIcon}
                    eventHandlers={{
                        click: () => onSelectPlace(place.id),
                        popupclose: () => onSelectPlace("")
                    }}
                >
                    <Popup>
                        <div className="flex flex-col gap-1 min-w-[200px]">
                            <h3 className="font-bold text-sm">{place.name}</h3>
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
        </MapContainer>
    );
}
