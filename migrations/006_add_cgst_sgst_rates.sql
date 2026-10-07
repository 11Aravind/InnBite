-- Migration: Add cgst_rate, sgst_rate, phone, address, and GST info to restaurant_settings table
-- Fixes Supabase error PGRST204: Could not find the 'cgst_rate' column of 'restaurant_settings' in the schema cache

ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS cgst_rate NUMERIC(5,2) DEFAULT 2.50,
ADD COLUMN IF NOT EXISTS sgst_rate NUMERIC(5,2) DEFAULT 2.50,
ADD COLUMN IF NOT EXISTS phone VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gst_no VARCHAR DEFAULT '',
ADD COLUMN IF NOT EXISTS tax_id VARCHAR DEFAULT '';

-- Notify schema cache update
NOTIFY pgrst, 'reload schema';
