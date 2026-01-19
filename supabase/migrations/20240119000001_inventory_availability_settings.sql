-- Inventory Availability Settings Table
-- Stores commitment levels, booking lead times, approval SLA, and block-out periods

CREATE TABLE IF NOT EXISTS inventory_availability_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL UNIQUE REFERENCES premium_inventory(id) ON DELETE CASCADE,
  commitment_level TEXT NOT NULL DEFAULT 'guaranteed' CHECK (commitment_level IN ('guaranteed', 'best_effort', 'remnant')),
  min_booking_lead_time TEXT NOT NULL DEFAULT '24_hours' CHECK (min_booking_lead_time IN ('no_lead', '24_hours', '48_hours', '72_hours', '1_week', '2_weeks')),
  campaign_approval_sla TEXT NOT NULL DEFAULT '4_business_hours' CHECK (campaign_approval_sla IN ('auto_approve', '1_business_hour', '4_business_hours', '24_hours', '48_hours')),
  block_out_periods JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_availability_settings_inventory_id ON inventory_availability_settings(inventory_id);

-- Enable RLS
ALTER TABLE inventory_availability_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to read (buyers need to see availability)
CREATE POLICY "Anyone can view availability settings"
  ON inventory_availability_settings
  FOR SELECT
  USING (true);

-- Allow inventory owners to insert/update their settings
CREATE POLICY "Owners can manage their availability settings"
  ON inventory_availability_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM premium_inventory
      WHERE premium_inventory.id = inventory_availability_settings.inventory_id
      AND premium_inventory.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM premium_inventory
      WHERE premium_inventory.id = inventory_availability_settings.inventory_id
      AND premium_inventory.owner_id = auth.uid()
    )
  );

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_availability_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_availability_settings_updated_at
  BEFORE UPDATE ON inventory_availability_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_settings_updated_at();
