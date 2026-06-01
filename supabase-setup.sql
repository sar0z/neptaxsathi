-- Create tax_calculations table
CREATE TABLE IF NOT EXISTS tax_calculations (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  device_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended for production)
ALTER TABLE tax_calculations ENABLE ROW LEVEL SECURITY;

-- Policy to allow read/write for all users (for testing)
-- For production, you should use auth.uid() instead
CREATE POLICY "Allow all access" ON tax_calculations
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tax_calculations_user_id ON tax_calculations(user_id);

-- Index for updated_at queries
CREATE INDEX IF NOT EXISTS idx_tax_calculations_updated_at ON tax_calculations(updated_at);

-- Index for ip_address queries
CREATE INDEX IF NOT EXISTS idx_tax_calculations_ip_address ON tax_calculations(ip_address);
