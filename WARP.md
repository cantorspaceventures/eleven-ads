# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**ElevenAds** is a Digital & OOH (Out-of-Home) Advertising Exchange platform connecting Publishers (supply-side) with Advertisers (demand-side) through Direct Deals and Real-Time Bidding (RTB).

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js (TypeScript) deployed as Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL with Row-Level Security)
- **State**: Zustand
- **Routing**: React Router DOM v7

## Development Commands

```bash
# Install dependencies
npm install

# Start both frontend and backend dev servers (recommended)
npm run dev

# Start frontend only (Vite dev server on :5173)
npm run client:dev

# Start backend only (Express via nodemon on :3000)
npm run server:dev

# Build for production
npm run build

# Type check without emitting
npm run check

# Lint
npm run lint

# Run database seed script
npx tsx seed.ts

# Run specific seed scripts
npx tsx scripts/seed_user.ts
npx tsx scripts/seed_inventory.ts
npx tsx scripts/seed_advertiser.ts
```

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

Frontend uses `VITE_` prefixed vars; backend uses `SUPABASE_SERVICE_ROLE_KEY` for admin operations.

## Architecture

### Directory Structure
- `src/` - React frontend (pages, components, hooks, lib)
- `api/` - Express backend (routes, services, types, lib)
- `supabase/migrations/` - Database schema migrations
- `scripts/` - Database seeding utilities

### API Routes (`api/routes/`)
All routes are prefixed with `/api/`:
- `/auth` - User authentication (signup, login, profile)
- `/inventory` - Publisher inventory management
- `/deals` - Deal negotiations between publishers and advertisers
- `/campaigns` - Advertiser campaign management
- `/rtb/bid` - OpenRTB 2.6 bid request endpoint (auction engine)
- `/ai` - AI-powered pricing explanations
- `/checkout` - Deal checkout processing

### User Roles
- `premium_advertiser` - Creates campaigns, buys ad space
- `premium_publisher` - Manages inventory, sells ad space
- `media_agency` - Agency managing multiple advertisers
- `admin` - Platform administration

### Key Database Tables
- `premium_users` - User profiles linked to Supabase auth
- `premium_inventory` - Ad inventory (OOH, DOOH, streaming, app, web)
- `campaigns` - Advertiser campaigns with RTB targeting
- `creatives` - Campaign creative assets
- `preferred_deals` - Direct deals between buyers/sellers
- `pmp_negotiations` - Private marketplace negotiations
- `dynamic_pricing` - AI-driven pricing with multipliers

### RTB Auction Engine (`api/services/AuctionEngine.ts`)
Implements OpenRTB 2.6 second-price auction:
1. Receives bid requests via POST `/api/rtb/bid`
2. Fetches internal bids from active campaigns
3. Fetches external bids from connected DSPs (mocked)
4. Runs second-price auction (winner pays runner-up price + $0.01)
5. Returns bid response with winning creative

### Frontend Routes
- `/` - Landing page
- `/login`, `/register` - Auth
- `/dashboard` - Advertiser dashboard
- `/publisher-dashboard` - Publisher dashboard
- `/admin-dashboard` - Admin panel
- `/inventory`, `/inventory/:id` - Browse/view inventory
- `/campaigns/new` - Create campaign wizard
- `/campaigns/analytics` - Campaign performance
- `/rtb-simulator` - Live RTB auction visualization

## Deployment

Deployed on Vercel:
- Frontend: Static SPA with `/index.html` fallback
- Backend: Serverless functions via `api/index.ts` entry point
- Use `vercel` or `vercel --prod` for deployment
