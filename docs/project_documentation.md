# Waitly - Master Project Documentation

**Generated:** December 27, 2025
**Version:** 1.0.0
**Status:** MVP / Beta

---

## 1. Executive Summary
**Waitly** is a real-time virtual queuing application designed to eliminate physical lines. It connects users with businesses ("Places") allowing them to join a queue remotely, track their status in real-time, and arrive just when it's their turn.
The platform serves three distinct user groups:
1.  **End Users**: Join queues, track wait times.
2.  **Vendors**: Manage active queues, call/complete tickets.
3.  **Admins**: Moderate platform content and businesses.

---

## 2. Technical Architecture

### 2.1 Core Stack
*   **Framework**: Next.js 16 (App Router)
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS + Lucide React (Icons)
*   **Maps**: React Leaflet (OpenStreetMap)
*   **Database**: Supabase (PostgreSQL)
*   **Auth**: Supabase Auth (Email/Password + Google OAuth support)
*   **Realtime**: Supabase Realtime (Websockets for queue updates)
*   **Storage**: Supabase Storage (Avatars)
*   **Emails**: Nodemailer (Gmail SMTP)
*   **PWA**: `@ducanh2912/next-pwa` (Service Workers, Manifest)

### 2.2 Key Architectural Decisions
*   **Client-Side Geo-Logic**: Distance calculations (Haversine formula) happen on the client to reduce server load and protect user privacy until necessary.
*   **App Router**: Leveraging React Server Components (RSC) where possible, but heavily relying on Client Components (`"use client"`) for Map and Realtime interactivity.
*   **Row Level Security (RLS)**: Security is enforced at the database layer. Even if the frontend is compromised, users can only access data permitted by SQL policies.
*   **Optimistic UI**: The Map and Queue interfaces update immediately upon interaction to feel "native-app snappy," reconciling with the server in the background.

---

## 3. Detailed Feature Specifications

### 3.1 End User Features
*   **Smart Discovery**:
    *   **Nearby Places**: Automatically shows businesses within a **4km radius** of the map's center.
    *   **Dynamic Search**: Searching overrides distance filters to search the global database.
    *   **Map Interaction**: "Search this area" logic triggers when the user drags the map.
*   **Virtual Queuing**:
    *   **Join Queue**: Users get a ticket number (e.g., A-101).
    *   **Disclaimer**: Users must be within range (geofence) to join (optional setting).
    *   **Live Tracking**: Real-time updates on "People ahead" and "Estimated Wait".
    *   **Notifications**: In-app banners when it's their turn.
*   **Profile Management**:
    *   **Avatar**: Upload custom image or select from presets (Robot, Ninja, Cat).
    *   **History**: View past visits and wait times.

### 3.2 Vendor Features (Business Owners)
*   **Queue Dashboard**:
    *   **Queue List**: See all waiting customers.
    *   **Action Controls**: "Call Next", "Mark No Show", "Complete Service".
*   **Performance Metrics**:
    *   View average wait times and daily throughput.
*   **Business Profile**: Edit name, address, operating hours, and turn-time estimates.

### 3.3 Admin Console
*   **Moderation**: Approve or Reject new business signups.
*   **Platform Stats**: View total users, businesses, and active queues.
*   **Gatekeeping**: Ensure quality control of listings on the map.

---

## 4. Complex Logic & Implementation Details

### 4.1 The Map System (`OSMMap.tsx`)
*   **Adaptive Visibility**:
    *   If `count <= 20`: Show ALL markers (prevents "disappearing marker" bugs).
    *   If `count > 20`: Enables **viewport culling** (only renders what's on screen) and **zoom filtering** (hides markers when zoomed out to City/World view).
*   **Re-centering**: The map emits `onMapMoveEnd` events to the parent page, triggering a data refresh logic for the "Nearby" list without causing infinite render loops.

### 4.2 Real-time Sync (`PlacesContext.tsx`)
*   **Subscription Model**: The app opens a single Supabase Realtime channel listening to the `tickets` and `places` tables.
*   **Optimistic Updates**: When a user joins a queue, the UI updates instantly. The listener ensures that if *another* user joins, the "People Ahead" count updates live without refreshing the page.

### 4.3 PWA Capabilities
*   **Manifest**: Defines app specific colors, icons, and "standalone" display mode.
*   **Service Worker**: Caches valid static assets (fonts, icons) for offline-first load speeds.
*   **Installability**: Triggered via browser native prompts on mobile.

---

## 5. Database Schema

### Tables
1.  **`places`**: Stores business info.
    *   `id`, `name`, `coordinates` (JSON), `is_approved` (Bool), `live_wait_time` (Int).
2.  **`tickets`**: Stores the queue.
    *   `id`, `user_id`, `place_id`, `status` (waiting, serving, completed, cancelled), `ticket_number`.
3.  **`profiles`**: Extends Supabase Auth.
    *   `id` (Foreign Key to Auth), `email`, `role` (user, vendor, admin).

### RLS Policies (Security)
*   **Places**: Public read access. Only Admins/Owners can update.
*   **Tickets**: Users can read their own. Vendors can read tickets for their Place.
*   **Profiles**: Users can only update their own profile.

---

## 6. Future Improvements & Roadmap

To take Waitly from MVP to a dominant platform:

### 6.1 Scalability Upgrades
*   **Clustered Map Markers**: When businesses exceed 500+, implement `react-leaflet-cluster` to group nearby pins (e.g., a circle saying "10").
*   **Geo-Spatial Indexing**: Move the 4km radius calculation from Client to **PostGIS** queries on Supabase for massive performance gains at scale.

### 6.2 Feature Expansions
*   **Monetization**:
    *   **Premium Listings**: Businesses pay to appear first in search or have a "Gold" pin.
    *   **SMS Notifications**: Integration with Twilio for "Your table is ready" SMS.
*   **AI Analytics**: Warning vendors "Expected rush hour at 6 PM" based on historical data.
*   **Pre-Ordering**: Allow users to order food/services *while* waiting in the virtual line.

### 6.3 Technical Dept Clean-up
*   **Testing**: Implement E2E testing with Playwright.
*   **Accessibility (a11y)**: rigorous audit for screen readers (ARIA labels for map markers).
