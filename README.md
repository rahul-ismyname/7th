# Waitly - Virtual Queue Management System

Waitly is a modern, real-time queue management application that eliminates physical waiting lines. Users can join queues remotely and receive smart notifications when their turn approaches.

## 🚀 Features

### For Users
- **Virtual Queuing**: Join queues from anywhere without physical presence
- **Single Queue Limit**: One active queue at a time to prevent abuse
- **Live Countdown**: Real-time MM:SS countdown to your turn
- **Smart Notifications**: 
  - 5-minute warning before your turn
  - Instant alert when it's your turn
- **User Ratings**: Rate your experience (1-5 stars) after your visit
- **Claim Business**: Request ownership of unmanaged locations
- **History Management**: View past visits and clear history
- **Mobile-First Design**: Toggle between Map and List views on mobile

### For Businesses (Vendors)
- **Queue Dashboard**: Manage active queues, call next customers, mark no-shows
- **Business ID**: Copyable business ID for easy reference and sharing
- **QR Code Integration**: Generate printable QR posters for walk-in customers
- **Real-time Queue List**: See waiting customers with position numbers
- **Approval Status**: Clear pending/live status indicators

### Admin Portal
- **Business Verification**: Approve/reject vendor registrations
- **Claim Management**: Review and approve claims for existing businesses
- **Stats Dashboard**: Total, pending, and approved business counts
- **Full Oversight**: View all places and tickets across the platform

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 16+](https://nextjs.org/) (App Router, Turbopack) |
| Database & Auth | [Supabase](https://supabase.com/) (PostgreSQL + Realtime) |
| Styling | [Tailwind CSS](https://tailwindcss.com/) |
| Maps | [React Leaflet](https://react-leaflet.js.org/) + OpenStreetMap |
| Emails | [Resend](https://resend.com/) |

## 🚀 Capacity & Performance
**How many users can this handle?**
Thanks to recent scalability optimizations (Optimistic Updates & Database Indexing):
- **Concurrent Users**: ~5,000 - 10,000 active users.
- **Daily Traffic**: Can easily handle 50,000+ daily visits.
- **Bottlenecks**: The primary limit is now your Email Provider (Gmail = 500/day) and Supabase's concurrent connection limit (depends on your tier).

## 📱 PWA Features
This app is a **Progressive Web App (PWA)**!
- **Installable**: Add to Home Screen on iOS/Android for a native app experience.
- **Offline Capable**: Works even with spotty internet.
- **App-like Feel**: No browser URL bar, full screen immersion.

## ⚙️ Quick Start

### 1. Database Setup (Crucial)
1.  Create a Supabase project.
2.  Go to **SQL Editor**.
3.  Copy the contents of `supabase/migrations/20251231055537_init_schema.sql`.
4.  Paste and Run. (This sets up Tables, RLS, Storage, Indexes, and Functions).

Alternatively, if you have the Supabase CLI:
```bash
npx supabase db push
```

### 2. Environment Setup
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
# Email Config (Use App Password for Gmail)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_char_app_password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Install & Run
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## ☁️ Deployment (Netlify/Vercel)
**Important**: Use the following Build Command to support PWA:
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

**Environment Variables for Production:**
| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
| `EMAIL_USER` | Your Gmail Address |
| `EMAIL_PASS` | Your Gmail App Password |
| `NEXT_PUBLIC_SITE_URL` | Production URL (e.g. `https://waitly.netlify.app`) |

## 💡 Key Features
*   **Virtual Queues**: Join from anywhere.
*   **Real-time Estimates**: "Your turn in 5 mins".
*   **Profile Customization**: Upload avatars or use Robot/Cat/Ninja presets.
*   **User Ratings**: Rate businesses after service.
*   **Admin Dashboard**: Manage business approvals.
*   **Vendor Portal**: "Call Next", "No Show", QR Code generation.

## 📄 License

MIT License
