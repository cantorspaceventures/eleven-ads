-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Premium Users table (Profile table linked to auth.users)
CREATE TABLE premium_users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('premium_advertiser', 'premium_publisher', 'media_agency', 'admin')),
    business_name VARCHAR(255) NOT NULL,
    trade_license VARCHAR(50) NOT NULL,
    media_license VARCHAR(50),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Premium Inventory table
CREATE TABLE premium_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES premium_users(id) ON DELETE CASCADE,
    inventory_type VARCHAR(30) NOT NULL CHECK (inventory_type IN ('OOH', 'DOOH', 'streaming_radio', 'streaming_video', 'app', 'web')),
    location_emirate VARCHAR(50) NOT NULL,
    location_data JSONB NOT NULL,
    audience_metrics JSONB NOT NULL,
    base_price_aed DECIMAL(10,2) NOT NULL CHECK (base_price_aed > 0),
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dynamic Pricing table
CREATE TABLE dynamic_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES premium_inventory(id) ON DELETE CASCADE,
    demand_multiplier DECIMAL(5,2) DEFAULT 1.00,
    time_multiplier DECIMAL(5,2) DEFAULT 1.00,
    availability_multiplier DECIMAL(5,2) DEFAULT 1.00,
    final_price_aed DECIMAL(10,2) NOT NULL,
    pricing_factors JSONB NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Preferred Deals table
CREATE TABLE preferred_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES premium_users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES premium_users(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES premium_inventory(id) ON DELETE CASCADE,
    agreed_price_aed DECIMAL(10,2) NOT NULL,
    volume_commitment INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PMP Negotiations table
CREATE TABLE pmp_negotiations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES premium_inventory(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES premium_users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES premium_users(id) ON DELETE CASCADE,
    buyer_offer_aed DECIMAL(10,2) NOT NULL,
    seller_counter_aed DECIMAL(10,2),
    negotiation_history JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Pricing Decisions table
CREATE TABLE ai_pricing_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES premium_inventory(id) ON DELETE CASCADE,
    market_factors JSONB NOT NULL,
    demand_signals JSONB NOT NULL,
    confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    explanation_data JSONB NOT NULL,
    decision_time TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Programmatic Guaranteed table
CREATE TABLE programmatic_guaranteed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    preferred_deal_id UUID REFERENCES preferred_deals(id) ON DELETE CASCADE,
    guaranteed_impressions INTEGER NOT NULL,
    total_value_aed DECIMAL(10,2) NOT NULL,
    guarantee_terms JSONB NOT NULL,
    is_fulfilled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pricing Explanations table
CREATE TABLE pricing_explanations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_decision_id UUID REFERENCES ai_pricing_decisions(id) ON DELETE CASCADE,
    factor_weights JSONB NOT NULL,
    explanation_text TEXT NOT NULL,
    market_comparisons JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_premium_users_email ON premium_users(email);
CREATE INDEX idx_premium_users_role ON premium_users(role);
CREATE INDEX idx_premium_users_verification ON premium_users(verification_status);
CREATE INDEX idx_premium_inventory_owner ON premium_inventory(owner_id);
CREATE INDEX idx_premium_inventory_type ON premium_inventory(inventory_type);
CREATE INDEX idx_premium_inventory_emirate ON premium_inventory(location_emirate);
CREATE INDEX idx_dynamic_pricing_inventory ON dynamic_pricing(inventory_id);
CREATE INDEX idx_preferred_deals_buyer ON preferred_deals(buyer_id);
CREATE INDEX idx_preferred_deals_seller ON preferred_deals(seller_id);
CREATE INDEX idx_preferred_deals_status ON preferred_deals(status);
CREATE INDEX idx_pmp_negotiations_inventory ON pmp_negotiations(inventory_id);
CREATE INDEX idx_pmp_negotiations_buyer ON pmp_negotiations(buyer_id);
CREATE INDEX idx_pmp_negotiations_status ON pmp_negotiations(status);
CREATE INDEX idx_ai_pricing_inventory ON ai_pricing_decisions(inventory_id);
CREATE INDEX idx_programmatic_guaranteed_deal ON programmatic_guaranteed(preferred_deal_id);
CREATE INDEX idx_pricing_explanations_decision ON pricing_explanations(pricing_decision_id);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Row Level Security (RLS) policies
ALTER TABLE premium_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view available inventory" ON premium_inventory FOR SELECT USING (is_available = true);
CREATE POLICY "Owners can manage own inventory" ON premium_inventory FOR ALL USING (auth.uid() = owner_id);

ALTER TABLE preferred_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own deals" ON preferred_deals FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Users can manage own deals" ON preferred_deals FOR ALL USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

ALTER TABLE premium_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON premium_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON premium_users FOR UPDATE USING (auth.uid() = id);

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_premium_users_modtime BEFORE UPDATE ON premium_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_premium_inventory_modtime BEFORE UPDATE ON premium_inventory FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_preferred_deals_modtime BEFORE UPDATE ON preferred_deals FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_pmp_negotiations_modtime BEFORE UPDATE ON pmp_negotiations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_programmatic_guaranteed_modtime BEFORE UPDATE ON programmatic_guaranteed FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
