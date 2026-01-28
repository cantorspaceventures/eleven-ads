-- Add CPM pricing fields for digital inventory
ALTER TABLE premium_inventory 
ADD COLUMN IF NOT EXISTS min_spend_aed DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_per_impression_aed DECIMAL(10,6);

-- Add comment to explain usage
COMMENT ON COLUMN premium_inventory.min_spend_aed IS 'Minimum spend required for digital inventory campaigns';
COMMENT ON COLUMN premium_inventory.cost_per_impression_aed IS 'Cost per impression for digital inventory (CPM/1000 rate)';
