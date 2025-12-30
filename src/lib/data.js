
export const PLACES = [
    {
        id: '1',
        name: 'SBI Bank',
        type: 'Bank',
        address: 'Connaught Place, Delhi',
        rating: 4.2,
        distance: '0.8 km',
        isApproved: true,
        coordinates: { lat: 28.6328, lng: 77.2197 },
        crowdLevel: 'High',
        liveWaitTime: 25,
        lastUpdated: '10:30 AM',
        queueLength: 12,
        currentServingToken: 'A-102',
        estimatedTurnTime: '10:45 AM'
    },
    {
        id: '2',
        name: 'Apollo Clinic',
        type: 'Clinic',
        address: 'Sector 18, Noida',
        rating: 4.5,
        distance: '5.2 km',
        isApproved: false,
        coordinates: { lat: 28.5708, lng: 77.3270 },
        crowdLevel: 'Medium',
        liveWaitTime: 45,
        lastUpdated: '09:45 AM'
    },
    {
        id: '3',
        name: 'Central Library',
        type: 'Public Service',
        address: 'Shivaji Bridge, Delhi',
        rating: 4.8,
        distance: '1.2 km',
        isApproved: false,
        coordinates: { lat: 28.6340, lng: 77.2220 },
        crowdLevel: 'Low',
        liveWaitTime: 5,
        lastUpdated: '10:15 AM'
    },
    {
        id: '4',
        name: 'KFC',
        type: 'Restaurant',
        address: 'Outer Circle, CP, Delhi',
        rating: 4.0,
        distance: '0.5 km',
        isApproved: true,
        coordinates: { lat: 28.6304, lng: 77.2200 },
        crowdLevel: 'Medium',
        liveWaitTime: 15,
        lastUpdated: '10:25 AM',
        queueLength: 5,
        currentServingToken: 'K-55',
        estimatedTurnTime: '10:20 AM'
    },
    {
        id: '5',
        name: 'RTO Office',
        type: 'Government',
        address: 'Janpath, Delhi',
        rating: 3.1,
        distance: '2.0 km',
        isApproved: false,
        coordinates: { lat: 28.6280, lng: 77.2180 },
        crowdLevel: 'High',
        liveWaitTime: 120,
        lastUpdated: '09:00 AM'
    },
    {
        id: '6',
        name: 'Dr. Lal PathLabs',
        type: 'Clinic',
        address: 'Barakhamba Road, Delhi',
        rating: 4.6,
        distance: '1.5 km',
        isApproved: true,
        coordinates: { lat: 28.6289, lng: 77.2243 },
        crowdLevel: 'Low',
        liveWaitTime: 10,
        lastUpdated: '10:40 AM',
        queueLength: 2,
        currentServingToken: 'L-12',
        estimatedTurnTime: '10:50 AM'
    }
];

export const CATEGORIES = [
    { id: 'all', label: 'All Places', icon: 'Store' },
    { id: 'Bank', label: 'Banks', icon: 'Landmark' },
    { id: 'Clinic', label: 'Clinics', icon: 'Stethoscope' },
    { id: 'Restaurant', label: 'Food', icon: 'Utensils' },
    { id: 'Government', label: 'Govt Offices', icon: 'Building2' },
    { id: 'Public Service', label: 'Public Services', icon: 'Library' },
];
