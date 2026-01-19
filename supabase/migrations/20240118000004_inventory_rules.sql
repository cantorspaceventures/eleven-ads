-- Inventory Buyer Access Rules table
-- Stores buyer access control, deal approval settings, and content restrictions per inventory

CREATE TABLE inventory_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventory_id UUID REFERENCES premium_inventory(id) ON DELETE CASCADE UNIQUE,
    
    -- Buyer Access Control
    access_mode VARCHAR(20) DEFAULT 'open' CHECK (access_mode IN ('open', 'whitelist_only', 'invite_only')),
    whitelisted_buyers TEXT[] DEFAULT '{}',
    blacklisted_buyers TEXT[] DEFAULT '{}',
    
    -- Deal Approval Settings (stored as JSONB for flexibility)
    deal_approval JSONB DEFAULT '{
        "autoApprove": false,
        "autoApproveConditions": {
            "meetsFloorPrice": true,
            "passesBrandSafety": true,
            "buyerVerified": true
        },
        "manualReviewFor": {
            "dealsAboveThreshold": true,
            "thresholdAmount": 10000,
            "sensitiveContent": true,
            "firstTimeBuyers": true
        }
    }'::jsonb,
    
    -- Content Restrictions
    prohibited_categories TEXT[] DEFAULT '{}',
    brand_safety_level VARCHAR(20) DEFAULT 'standard' CHECK (brand_safety_level IN ('relaxed', 'standard', 'strict')),
    additional_restrictions TEXT DEFAULT '',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_inventory_rules_inventory ON inventory_rules(inventory_id);

-- Enable RLS
ALTER TABLE inventory_rules ENABLE ROW LEVEL SECURITY;

-- Policies: Owners can manage their inventory rules
CREATE POLICY "Owners can view own inventory rules" ON inventory_rules 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM premium_inventory 
            WHERE premium_inventory.id = inventory_rules.inventory_id 
            AND premium_inventory.owner_id = auth.uid()
        )
    );

CREATE POLICY "Owners can manage own inventory rules" ON inventory_rules 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM premium_inventory 
            WHERE premium_inventory.id = inventory_rules.inventory_id 
            AND premium_inventory.owner_id = auth.uid()
        )
    );

-- Allow buyers to view rules for available inventory (read-only)
CREATE POLICY "Buyers can view rules for available inventory" ON inventory_rules 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM premium_inventory 
            WHERE premium_inventory.id = inventory_rules.inventory_id 
            AND premium_inventory.is_available = true
        )
    );

-- Trigger to update updated_at
CREATE TRIGGER update_inventory_rules_modtime 
    BEFORE UPDATE ON inventory_rules 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Grant permissions
GRANT SELECT ON inventory_rules TO anon;
GRANT ALL PRIVILEGES ON inventory_rules TO authenticated;
GRANT ALL PRIVILEGES ON inventory_rules TO service_role;
