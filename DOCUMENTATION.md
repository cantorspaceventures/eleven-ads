# ElevenAds Platform Documentation

**ElevenAds** is a next-generation Digital & OOH Advertising Exchange that connects Publishers (supply) with Advertisers (demand) through both Direct Deals and Real-Time Bidding (RTB).

---

## 📚 Table of Contents
1. [Getting Started](#getting-started)
2. [Publisher Guide](#publisher-guide)
3. [Advertiser Guide](#advertiser-guide)
4. [Admin Guide](#admin-guide)
5. [Real-Time Bidding (RTB) Simulator](#real-time-bidding-rtb-simulator)
6. [API Reference](#api-reference)

---

## 🚀 Getting Started

### Access the Platform
- **Live URL:** [https://traewjn05ka2.vercel.app](https://traewjn05ka2.vercel.app)
- **Local Dev:** `http://localhost:5173`

### Account Types
1. **Publisher:** Sells ad space (Billboards, Apps, Websites).
2. **Advertiser:** Buys ad space for campaigns.
3. **Admin:** Manages the platform, users, and compliance.

---

## 🏢 Publisher Guide
*For media owners looking to monetize their inventory.*

### 1. Registration & Onboarding
1. Go to `/register` and select **"Publisher"**.
2. Complete the **3-Step Wizard**:
   - **Account:** Business Name, Email, Password.
   - **Verification:** Upload Trade License (PDF/Image) and Tax ID.
   - **Payment:** Enter Bank Details (IBAN/Swift) for payouts.

### 2. Managing Inventory
- **Dashboard:** View revenue trends, fill rates, and active units at `/publisher-dashboard`.
- **Add Single Unit:**
  1. Click **"Add Inventory"**.
  2. Select Type: `OOH`, `Streaming Audio`, `Video`, `App`, or `Web`.
  3. Fill in details (e.g., "Station Format" for Radio, "Resolution" for Video).
  4. Set **Base Price (CPM)** and **Daily Impressions**.
- **Bulk Upload:**
  1. Click **"Bulk Upload"** in the dashboard.
  2. Download the CSV Template.
  3. Fill in your inventory rows and upload.

### 3. Deals & Negotiations
- Navigate to the **"Deals"** tab.
- View incoming offers from Advertisers.
- **Action:** Accept, Reject, or Counter-Offer directly in the UI.

---

## 📢 Advertiser Guide
*For brands and agencies looking to run campaigns.*

### 1. Launching a Campaign
1. Go to your **Dashboard** and click **"Create Campaign"**.
2. **Step 1: Details:** Name your campaign and select objective (Awareness/Conversion).
3. **Step 2: Targeting:**
   - **Geo:** Select Cities (e.g., Dubai, Abu Dhabi) or specific districts.
   - **Demographics:** Age, Gender, Income Level.
   - **Interests:** Select audience segments (e.g., "Luxury", "Fitness").
4. **Step 3: Creative:** Upload your ad assets (Images/Videos).
5. **Step 4: Budget & Bidding:**
   - Set **Daily Budget** (e.g., 500 AED).
   - Set **Max CPM Bid** (e.g., 45 AED) for the RTB auction.
6. **Step 5: Review:** Check all details and click **"Launch"**.

### 2. Analytics
- Go to `/campaigns/analytics`.
- View real-time charts for **Impressions**, **Spend**, and **CTR**.
- Track performance by location and creative type.

---

## 🛡️ Admin Guide
*For platform operators.*

### 1. Dashboard Overview
- Access `/admin-dashboard`.
- View platform-wide **Total Revenue**, **Active Campaigns**, and **System Health**.

### 2. User Management
- Go to the **"User Management"** tab.
- Review pending Publisher applications.
- **Action:** Approve verified accounts or Reject incomplete ones.

---

## ⚡ Real-Time Bidding (RTB) Simulator
*Visualize the OpenRTB Auction Engine in action.*

### How it Works
The platform runs a **Second-Price Auction** combining:
1. **Internal Campaigns:** Created by Advertisers on ElevenAds.
2. **External DSPs:** Simulated bids from partners like The Trade Desk or Google DV360.

### Using the Simulator
1. Navigate to `/rtb-simulator`.
2. Click **"Start Simulation"**.
3. **Watch Live Logs:**
   - The system generates random Bid Requests (e.g., "User in Dubai looking at a Billboard").
   - It broadcasts the request to all bidders.
   - **Result:** See who won (`WON`) and the clearing price (`AED`).
   - **Source:** Check if the winner was `elevenads-dsp` (Internal) or `TradeDesk-Mock` (External).

---

## 🔌 API Reference

### Endpoints
- **POST `/api/rtb/bid`**: OpenRTB 2.6 Endpoint for incoming bid requests.
- **POST `/api/campaigns`**: Create new campaigns.
- **GET `/api/inventory`**: Fetch available inventory.

### Authentication
All API requests (except RTB) require a Bearer Token (Supabase JWT).

---

*Documentation generated on Jan 18, 2026 for ElevenAds v1.0*
