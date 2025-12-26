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

## ⚙️ Quick Start

```bash
# 1. Clone & Install
git clone https://github.com/your-username/waitly.git
cd waitly
npm install

# 2. Environment Setup (.env.local)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key

# 3. Database Setup
# Run `complete_schema.sql` in Supabase SQL Editor

# 4. Start Development
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 📱 Pages

| Route | Description |
|-------|-------------|
| `/` | Main Map & Queue Interface |
| `/login` | User Authentication |
| `/vendor` | Vendor Portal (Manage Queues) |
| `/admin` | Admin Console (Hidden, for approvals) |
| `/history` | User Ticket History |
| `/profile` | User Settings & Sign Out |

## 🔒 Security

- **Row Level Security (RLS)**: Users can only view/edit/delete their own tickets
- **Vendor Isolation**: Vendors can only manage their own businesses
- **Admin-Only Approval**: Businesses require admin verification to go live
- **Closed Registration**: Businesses default to "Pending" status

## 💡 Future Enhancement Ideas

Here are some features to consider for future updates:

### High Priority
- [ ] **Push Notifications**: Native mobile push via PWA or app
- [ ] **SMS Alerts**: Twilio integration for SMS notifications
- [ ] **Email Confirmations**: Send ticket confirmation emails
- [ ] **Analytics Dashboard**: Queue metrics, peak hours, avg wait times

### Medium Priority
- [ ] **Multi-Location Support**: One vendor managing multiple branches
- [ ] **Walk-in Kiosk Mode**: Fullscreen tablet interface for walk-ins
- [ ] **Estimated Wait Calculator**: AI-based wait time predictions
- [ ] **Staff Management**: Multiple operators per business

### Nice to Have
- [ ] **Dark Mode**: System-wide dark theme toggle
- [ ] **Language Support**: i18n for Hindi, Spanish, etc.
- [ ] **Queue Pre-booking**: Schedule queue joins in advance
- [ ] **Customer Feedback**: Post-visit ratings and reviews
- [ ] **Wait Time Leaderboard**: Gamification for frequent visitors

## 📄 License

MIT License
