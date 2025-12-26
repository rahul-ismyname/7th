export type CrowdLevel = "Low" | "Medium" | "High";

export interface Place {
    id: string;
    name: string;
    type: string;
    address: string;
    rating: number;
    distance: string;
    isApproved: boolean;
    coordinates: { lat: number; lng: number }; // UPDATED: Real GPS

    // For Non-Approved (Mode 1)
    crowdLevel?: CrowdLevel;
    liveWaitTime?: number; // minutes
    lastUpdated?: string;

    // For Approved (Mode 2)
    queueLength?: number;
    currentServingToken?: string;
    estimatedTurnTime?: string;
}

export const PLACES: Place[] = [
    {
        id: "1",
        name: "SBI Bank",
        type: "Bank",
        address: "Connaught Place, Delhi",
        rating: 4.2,
        distance: "40 m",
        isApproved: true,
        coordinates: { lat: 28.6328, lng: 77.2197 }, // Inner Circle
        queueLength: 12,
        currentServingToken: "A-102",
        estimatedTurnTime: "10:45 AM",
        liveWaitTime: 25,
    },
    {
        id: "2",
        name: "Apollo Clinic",
        type: "Clinic",
        address: "Sector 18, Noida",
        rating: 4.5,
        distance: "25 m",
        isApproved: false,
        coordinates: { lat: 28.5708, lng: 77.3270 }, // Sector 18 Noida (Approx) - Keeping it close to CP for demo or redirect logic if needed, but per request staying to CP area mostly? Re-reading: Context checks out. Let's keep them somewhat closer for visual purposes or just valid coords.
        crowdLevel: "Medium",
        liveWaitTime: 45,
        lastUpdated: "10 mins ago",
    },
    {
        id: "3",
        name: "Central Library",
        type: "Public Service",
        address: "Shivaji Bridge",
        rating: 4.8,
        distance: "35 m",
        isApproved: false,
        coordinates: { lat: 28.6340, lng: 77.2220 }, // Outer Circle
        crowdLevel: "Low",
        liveWaitTime: 10,
        lastUpdated: "Just now",
    },
    {
        id: "4",
        name: "KFC",
        type: "Restaurant",
        address: "Outer Circle, CP",
        rating: 4.0,
        distance: "20 m",
        isApproved: true,
        coordinates: { lat: 28.6304, lng: 77.2200 }, // Southern Radial
        queueLength: 5,
        currentServingToken: "K-55",
        estimatedTurnTime: "10:20 AM",
        liveWaitTime: 15,
    },
    {
        id: "5",
        name: "RTO Office",
        type: "Government",
        address: "Janpath",
        rating: 3.1,
        distance: "1.2 km",
        isApproved: false,
        coordinates: { lat: 28.6280, lng: 77.2180 }, // Janpath
        crowdLevel: "High",
        liveWaitTime: 120,
        lastUpdated: "2 mins ago",
    },
];
