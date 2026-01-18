-- Migration: Add RTB fields to campaigns table

ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS max_cpm_bid DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS targeting JSONB DEFAULT '{}'::jsonb;

-- Add index on targeting for faster auction lookups (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_campaigns_targeting ON campaigns USING GIN (targeting);

-- Add index on status to quickly filter active campaigns during auction
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Comments for clarity
COMMENT ON COLUMN campaigns.max_cpm_bid IS 'Maximum Bid Price per 1000 impressions in AED';
COMMENT ON COLUMN campaigns.targeting IS 'JSON structure containing OpenRTB-like targeting rules (geo, device, segment)';
