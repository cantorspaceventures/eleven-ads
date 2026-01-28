import { useState, useEffect } from 'react';
import { Book, Video, HelpCircle, ArrowLeft, PlayCircle, FileText, ExternalLink } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import MarkdownViewer from '@/components/MarkdownViewer';
import VideoPlayerModal from '@/components/VideoPlayerModal';

// Map guide links to actual markdown files
const MARKDOWN_FILES: Record<string, string> = {
  '#setup': '/help/PUBLISHER_ONBOARDING.md',
  '#listing': '/help/PUBLISHER_ONBOARDING.md',
  '#revenue': '/help/PUBLISHER_ONBOARDING.md',
  '#campaign': '/help/ADVERTISER_ONBOARDING.md',
  '#bidding': '/help/ADVERTISER_ONBOARDING.md',
  '#analytics': '/help/ADVERTISER_ONBOARDING.md'
};

export default function HelpCenterPage() {
  const [activeTab, setActiveTab] = useState<'publisher' | 'advertiser'>('publisher');
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewingDoc, setViewingDoc] = useState<{ content: string, title: string } | null>(null);
  const [playingVideo, setPlayingVideo] = useState<{ title: string, description: string, videoUrl: string, script: string } | null>(null);

  // Check URL for direct article links
  useEffect(() => {
    const article = searchParams.get('article');
    if (article && MARKDOWN_FILES[`#${article}`]) {
      loadDocument(`#${article}`);
    }
  }, [searchParams]);

  const loadDocument = async (link: string) => {
    const filePath = MARKDOWN_FILES[link];
    if (!filePath) return;

    try {
      // In a real app, this would be an API call. 
      // For this demo, we'll try to fetch the file directly from the public folder or similar.
      // Since we can't easily fetch local files in a client-side app without a bundler loader,
      // we will use a hardcoded map for the demo content based on what we just wrote.
      
      let content = '';
      let title = '';

      if (filePath.includes('PUBLISHER')) {
        title = "Publisher Guide";
        content = `# 🏙️ Publisher Onboarding Guide

Welcome to **ElevenAds**! This guide will help you monetize your digital and physical ad inventory effectively.

---

## 🚀 Step 1: Account Setup & Verification

Before you can list inventory, we need to verify your business identity.

1.  **Register:**
    *   Visit the registration page.
    *   Select **"I am a Publisher"**.
    *   Enter your **Business Name** and **Email**.

2.  **Complete Profile:**
    *   Upload your **Trade License** (PDF or Image).
    *   Enter your **Tax Registration Number (TRN)**.
    *   Provide valid **Bank Details** (IBAN/Swift) for payouts.

3.  **Wait for Approval:**
    *   Our Admin team reviews documents within 24 hours.
    *   You will receive an email once your account is **Active**.

---

## 📍 Step 2: Listing Your Inventory

You can list Billboards, Digital Screens, Mobile Apps, or Websites.

### Option A: Add Single Asset
1.  Navigate to your **Dashboard**.
2.  Click the **"Add Inventory"** button (Top Right).
3.  **Select Media Type:**
    *   \`OOH / DOOH\`: For physical billboards.
    *   \`Streaming\`: For Audio/Video ads.
    *   \`App / Web\`: For digital placements.
4.  **Fill Details:**
    *   **Location:** City/District.
    *   **Resolution:** e.g., \`1920x1080\` or \`15s Audio\`.
    *   **Traffic/Impressions:** Daily average footfall or views.
    *   **Base Price:** Your minimum CPM (Cost Per Mille) in AED.
5.  Click **"List Asset"**.

### Option B: Bulk Upload
1.  Click **"Bulk Upload"** in the Dashboard header.
2.  **Download Template:** Get the CSV file.
3.  **Fill Data:** Add rows for each asset (Address, Type, Dimensions, Price).
4.  **Upload:** Drag & drop the completed CSV.
5.  **Review:** Check for errors and confirm import.

---

## 🤝 Step 3: Managing Deals & Revenue

### Direct Deals
*   Advertisers may send you **Direct Offers** for specific inventory.
*   Go to the **"Deals"** tab to view pending offers.
*   **Actions:**
    *   ✅ **Accept:** Immediately activates the deal.
    *   ❌ **Reject:** Declines the offer.
    *   💬 **Negotiate:** Propose a new price.

### Real-Time Bidding (RTB)
*   If your inventory is "Digital" (DOOH, App, Web), it is automatically enrolled in our **RTB Exchange**.
*   **How it works:**
    *   When a slot opens, we broadcast a request to Advertisers.
    *   The highest bidder wins instantly.
    *   You earn revenue automatically based on the clearing price.

### Dashboard Analytics
*   **Total Revenue:** Track your earnings month-to-date.
*   **Fill Rate:** See what % of your inventory is sold.
*   **Active Units:** Monitor live assets.`;
      } else {
        title = "Advertiser Guide";
        content = `# 📢 Advertiser Onboarding Guide

Welcome to **ElevenAds**! Reach your target audience across Billboards, Radio, and Digital Apps with ease.

---

## 🚀 Step 1: Account Creation

1.  **Sign Up:**
    *   Visit the registration page.
    *   Select **"I am an Advertiser"**.
    *   Enter your **Company Name** and **Contact Details**.

2.  **Payment Setup:**
    *   Go to **Settings > Billing**.
    *   Add a **Credit Card** or link a **Corporate Account**.
    *   *Note: Campaigns cannot start without a valid payment method.*

---

## 🎯 Step 2: Launching a Campaign

Use our 5-Step Wizard to create high-impact campaigns.

### 1. Campaign Details
*   **Name:** Give it a recognizable name (e.g., "Summer Sale 2026").
*   **Objective:**
    *   \`Brand Awareness\`: Maximize views (CPM).
    *   \`Conversions\`: Maximize actions (CPC/CPA).

### 2. Targeting (The Secret Sauce)
*   **Location:** Select specific **Emirates** (Dubai, Abu Dhabi) or **Neighborhoods** (Marina, JLT).
*   **Demographics:** Filter by Age, Gender, and Income Level.
*   **Interests:** Target user behaviors (e.g., "Luxury Shoppers", "Tech Enthusiasts").

### 3. Creative Assets
*   **Upload:** Drag & drop your ads.
*   **Formats Supported:**
    *   Images: JPG, PNG (Max 5MB).
    *   Video: MP4 (15s/30s, Max 50MB).
    *   HTML5: Zip bundles for interactive ads.

### 4. Budget & Bidding
*   **Budget Type:**
    *   \`Daily\`: Cap spend per day (e.g., 500 AED).
    *   \`Lifetime\`: Total spend for the whole campaign.
*   **Bidding Strategy:**
    *   **Max CPM Bid:** The most you are willing to pay for 1,000 impressions.
    *   *Tip: Higher bids win more prime-time slots!*

### 5. Review & Launch
*   Double-check your targeting and creatives.
*   Click **"Launch Campaign"**.
*   *Approval takes < 2 hours.*

---

## 📊 Step 3: Analyzing Performance

Go to the **"Analytics"** tab to see real-time data:

*   **Impressions:** How many times your ad was seen.
*   **Spend:** Real-time cost tracking.
*   **CTR (Click-Through Rate):** Percentage of users who clicked (for Digital ads).
*   **Heatmaps:** See which locations perform best.

---

## 🤝 Step 4: Direct Deals (Premium Inventory)

Want a specific Billboard on Sheikh Zayed Road?

1.  Go to **"Marketplace"**.
2.  Filter for **Premium OOH**.
3.  Click **"Make Offer"** on a specific asset.
4.  Enter your price and dates.
5.  The Publisher will Accept or Counter-offer.`;
      }

      setViewingDoc({ content, title });
      setSearchParams({ article: link.replace('#', '') });
    } catch (e) {
      console.error("Failed to load document", e);
    }
  };

  const closeDocument = () => {
    setViewingDoc(null);
    setSearchParams({});
  };

  if (viewingDoc) {
    return <MarkdownViewer content={viewingDoc.content} title={viewingDoc.title} onBack={closeDocument} />;
  }

  const guides = {
    publisher: [
      {
        title: "Account Setup & Verification",
        description: "Learn how to register, upload trade licenses, and get verified.",
        icon: <Book className="w-5 h-5" />,
        link: "#setup"
      },
      {
        title: "Listing Inventory",
        description: "Step-by-step guide to adding Single Assets and Bulk Uploading.",
        icon: <FileText className="w-5 h-5" />,
        link: "#listing"
      },
      {
        title: "Understanding Revenue",
        description: "How RTB auctions work and how to track your earnings.",
        icon: <HelpCircle className="w-5 h-5" />,
        link: "#revenue"
      }
    ],
    advertiser: [
      {
        title: "Launching a Campaign",
        description: "Master the 5-step wizard: Targeting, Budgeting, and Creatives.",
        icon: <Book className="w-5 h-5" />,
        link: "#campaign"
      },
      {
        title: "Bidding Strategies",
        description: "CPM vs CPC and how to win Real-Time Auctions.",
        icon: <HelpCircle className="w-5 h-5" />,
        link: "#bidding"
      },
      {
        title: "Analytics Deep Dive",
        description: "Interpreting impressions, CTR, and spend heatmaps.",
        icon: <FileText className="w-5 h-5" />,
        link: "#analytics"
      }
    ]
  };

  const videos = {
    publisher: {
      title: "Monetizing with ElevenAds",
      duration: "1:00",
      thumbnail: "bg-blue-100",
      description: "Turn your screens and apps into revenue machines. A quick tour of the Publisher Dashboard.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      script: `0:00 - Introduction (Logo Animation)
Narrator: "Welcome to ElevenAds. The smartest way to monetize your digital and physical ad inventory. Let's get you set up."

0:10 - Chapter 1: Account Setup
Visual: Registration Page form being filled.
Narrator: "First, select 'I am a Publisher' on the signup page. Enter your business details. Once inside, you'll need to verify your account by uploading your Trade License and Tax ID in the Settings menu. This ensures a safe marketplace for everyone."

0:30 - Chapter 2: Adding Inventory
Visual: Clicking 'Add Inventory' button -> Selecting 'OOH'.
Narrator: "Ready to list? Go to your Dashboard and click 'Add Inventory'. Choose your media type—Billboards, Screens, or Apps. Enter the location, daily impressions, and resolution. Most importantly, set your 'Base Price'. This is the minimum amount you're willing to accept for an ad slot."

0:55 - Chapter 3: Deal Types
Visual: Split screen showing 'Direct Deals' icon and 'RTB' icon.
Narrator: "There are two ways to earn. First, 'Direct Deals'—where advertisers send you specific offers that you can Accept, Reject, or Negotiate in the Deals tab. Second, 'RTB'—Real-Time Bidding. If you have digital screens, our engine automatically fills unsold slots with the highest bidder from our global exchange."

1:20 - Chapter 4: Managing Your Dashboard
Visual: Dashboard charts and 'Active Units' list.
Narrator: "Your Dashboard is your command center. Track your 'Total Revenue' in real-time, monitor which units are active, and see your fill rates. Use the 'Bulk Upload' feature if you have hundreds of screens to manage at once."

1:40 - Conclusion
Visual: Happy Publisher checking revenue on mobile. Text: 'Start Monetizing Today'.
Narrator: "It's that simple. Sign up today and turn your inventory into income with ElevenAds."`
    },
    advertiser: {
      title: "Launch Your First Campaign",
      duration: "1:30",
      thumbnail: "bg-purple-100",
      description: "Reach your audience everywhere. Learn how to target and bid effectively.",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      script: `0:00 - Montage: Digital Billboards, Mobile Ads, Video Ads. "Reach your audience everywhere. One platform, infinite possibilities."
0:10 - Screen capture: "Create Campaign" Wizard. Mouse clicking "Targeting". "Start by defining who you want to reach. Target by City, Age, Gender, or Interests."
0:25 - Visual: Map zooming into "Dubai Marina". "Pinpoint specific neighborhoods to ensure your message hits the right eyes."
0:40 - Action: Uploading a Video creative. "Upload your high-impact creatives. We support Video, Images, and HTML5."
0:55 - Action: Setting Budget Slider to 5000 AED. "You're in control. Set a daily budget and a Max Bid price. No hidden fees."
1:10 - Screen capture: Analytics Dashboard with "Impressions" counter ticking up. "Watch your campaign go live. Track impressions and clicks in real-time."
1:25 - Logo animation. Text: "Start Advertising". "Smarter advertising starts here. Launch your campaign with ElevenAds."`
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <VideoPlayerModal 
        isOpen={!!playingVideo} 
        onClose={() => setPlayingVideo(null)} 
        video={playingVideo} 
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-gray-500 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900 flex items-center">
              <HelpCircle className="w-6 h-6 mr-2 text-blue-600" /> Help Center
            </h1>
          </div>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('publisher')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'publisher' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Publishers
            </button>
            <button
              onClick={() => setActiveTab('advertiser')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                activeTab === 'advertiser' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Advertisers
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Hero Section */}
        <div className={`rounded-2xl p-8 text-white ${activeTab === 'publisher' ? 'bg-gradient-to-r from-blue-600 to-blue-800' : 'bg-gradient-to-r from-purple-600 to-purple-800'}`}>
          <h2 className="text-3xl font-bold mb-4">
            {activeTab === 'publisher' ? 'Maximize Your Inventory Revenue' : 'Reach Your Perfect Audience'}
          </h2>
          <p className="text-lg opacity-90 max-w-2xl">
            {activeTab === 'publisher' 
              ? 'Learn how to list assets, manage deals, and optimize your fill rates with our comprehensive guides.' 
              : 'Master the art of programmatic advertising. From targeting to analytics, we have got you covered.'}
          </p>
        </div>

        {/* Video Tutorial Section */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Video className="w-5 h-5 mr-2 text-gray-500" /> Video Tutorials
          </h3>
          <div 
            onClick={() => setPlayingVideo(videos[activeTab])}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row hover:shadow-md transition-shadow cursor-pointer group"
          >
            <div className={`w-full md:w-64 h-48 ${videos[activeTab].thumbnail} flex items-center justify-center relative`}>
              <PlayCircle className={`w-16 h-16 ${activeTab === 'publisher' ? 'text-blue-600' : 'text-purple-600'} opacity-80 group-hover:scale-110 transition-transform`} />
              <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {videos[activeTab].duration}
              </span>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center">
              <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {videos[activeTab].title}
              </h4>
              <p className="text-gray-600 mb-4">
                {videos[activeTab].description}
              </p>
              <span className="text-sm font-medium text-blue-600 flex items-center">
                Watch Now <ExternalLink className="w-4 h-4 ml-1" />
              </span>
            </div>
          </div>
        </div>

        {/* Documentation Grid */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Book className="w-5 h-5 mr-2 text-gray-500" /> Documentation & Guides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {guides[activeTab].map((guide, idx) => (
              <div 
                key={idx} 
                onClick={() => loadDocument(guide.link)}
                className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${activeTab === 'publisher' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {guide.icon}
                </div>
                <h4 className="font-bold text-gray-900 mb-2">{guide.title}</h4>
                <p className="text-sm text-gray-500 mb-4">{guide.description}</p>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Read Article</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gray-100 rounded-xl p-8 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Still need help?</h3>
          <p className="text-gray-600 mb-6">Our support team is available 24/7 to assist you with any technical or strategic questions.</p>
          <button className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
}
