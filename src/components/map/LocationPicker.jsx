"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon issue
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

function ClickHandler({ onLocationSelect }) {
    useMapEvents({
        click: (e) => {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function ViewUpdater({ coords }) {
    const map = useMap();
    useEffect(() => {
        if (coords) {
            map.flyTo(coords, 15);
        }
    }, [coords, map]);
    return null;
}

export default function LocationPicker({ onLocationSelect, coordinates }) {
    const [position, setPosition] = useState(coordinates ? [coordinates.lat, coordinates.lng] : null);

    // Sync internal state if external props change (e.g. from Auto-Location)
    useEffect(() => {
        if (coordinates) {
            setPosition([coordinates.lat, coordinates.lng]);
        }
    }, [coordinates]);

    return (
        <MapContainer center={[28.6328, 77.2197]} zoom={11} className="w-full h-full rounded-xl z-0">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <ClickHandler onLocationSelect={(lat, lng) => {
                setPosition([lat, lng]);
                onLocationSelect(lat, lng);
            }} />
            <ViewUpdater coords={position} />
            {position && <Marker position={position} icon={customIcon} />}
        </MapContainer>
    );
}
