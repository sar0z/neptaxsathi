-- Add new columns to existing tax_calculations table
ALTER TABLE tax_calculations
  ADD COLUMN IF NOT EXISTS ip_address TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS device_info JSONB,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for ip_address queries
CREATE INDEX IF NOT EXISTS idx_tax_calculations_ip_address ON tax_calculations(ip_address);
