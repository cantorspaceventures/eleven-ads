-- Enable REPLICA IDENTITY FULL for dynamic_pricing table
-- This is required for Supabase Realtime to send the full row data on updates
ALTER TABLE dynamic_pricing REPLICA IDENTITY FULL;

-- Also ensure the table is part of the realtime publication (in case previous migration didn't work)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'dynamic_pricing'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE dynamic_pricing;
  END IF;
END $$;
