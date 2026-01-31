import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Zap, Globe, Lock, Crown } from 'lucide-react';
import Logo from '@/components/Logo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center">
             <Logo />
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#inventory" className="text-sm font-medium hover:text-primary transition-colors">Inventory</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link to="/login" className="text-sm font-medium hover:text-primary transition-colors">Log In</Link>
            <Link to="/register" className="bg-secondary text-white px-5 py-2.5 rounded-md text-sm font-medium hover:bg-secondary/90 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-heading font-bold text-secondary mb-6 leading-tight">
              Premium Programmatic for the <span className="text-primary">UAE Market</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 mb-10 max-w-2xl mx-auto">
              Access exclusive OOH, DOOH, and streaming inventory with AI-driven dynamic pricing and complete transparency.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="w-full sm:w-auto bg-primary text-white px-8 py-4 rounded-md text-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center">
                Start Trading <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/inventory" className="w-full sm:w-auto border border-gray-200 bg-white text-secondary px-8 py-4 rounded-md text-lg font-medium hover:bg-gray-50 transition-colors">
                View Inventory
              </Link>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-4">Why ElevenAds?</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">Built specifically for the sophisticated needs of the UAE's digital advertising ecosystem.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Open Auction (RTB)</h3>
              <p className="text-gray-500">Real-time bidding on the open market. Access remnant inventory instantly with our OpenRTB 2.6 engine.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Private Deals (PMP)</h3>
              <p className="text-gray-500">Invite-only auctions and preferred deals. Negotiate directly with publishers for first-look access.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Programmatic Guaranteed</h3>
              <p className="text-gray-500">Secure fixed-price, guaranteed volume contracts programmatically. Premium inventory with no uncertainty.</p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Dynamic AI Pricing</h3>
              <p className="text-gray-500">Smart floor prices that adapt to real-time demand, time-of-day, and availability multipliers.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Brand Safety</h3>
              <p className="text-gray-500">Verified publishers and strict creative review policies ensure a safe environment for your brand.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-3">Transparent Analytics</h3>
              <p className="text-gray-500">Clear insights into spending, performance, and pricing factors. No black-box algorithms.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
