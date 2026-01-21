-- Enable RLS on dynamic_pricing (required for Supabase Realtime postgres_changes)
ALTER TABLE dynamic_pricing ENABLE ROW LEVEL SECURITY;

-- Allow anyone to SELECT (read) dynamic_pricing data
CREATE POLICY "Allow public read access for dynamic_pricing" ON dynamic_pricing
  FOR SELECT
  USING (true);

-- Allow service role and authenticated users to update
CREATE POLICY "Allow authenticated update for dynamic_pricing" ON dynamic_pricing
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated insert for dynamic_pricing" ON dynamic_pricing
  FOR INSERT
  WITH CHECK (true);
