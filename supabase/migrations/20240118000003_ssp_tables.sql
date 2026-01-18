-- Table for External DSP Configurations
CREATE TABLE IF NOT EXISTS connected_dsps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  api_key TEXT,
  qps_limit INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed some mock DSPs
INSERT INTO connected_dsps (name, endpoint_url) VALUES 
('TradeDesk Mock', 'http://localhost:3000/api/mock-dsp/ttd'),
('Google DV360 Mock', 'http://localhost:3000/api/mock-dsp/dv360');
