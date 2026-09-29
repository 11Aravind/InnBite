-- Add payment_mode, app_name, theme_color, service_mode, and logo_url columns to restaurant_settings table
ALTER TABLE restaurant_settings 
ADD COLUMN IF NOT EXISTS payment_mode VARCHAR DEFAULT 'BOTH',
ADD COLUMN IF NOT EXISTS app_name VARCHAR DEFAULT 'InnBite',
ADD COLUMN IF NOT EXISTS theme_color VARCHAR DEFAULT 'emerald',
ADD COLUMN IF NOT EXISTS logo_url TEXT DEFAULT '/logo/innbite-logo.png';

-- Update service_mode default if needed
ALTER TABLE restaurant_settings 
ALTER COLUMN service_mode SET DEFAULT 'TABLE_SERVICE';

-- Insert or Update default Settings row for R001
INSERT INTO restaurant_settings (restaurant_id, restaurant_name, app_name, service_mode, payment_mode, theme_color, logo_url, common_qr_code, common_qr_status)
VALUES ('R001', 'InnBite Restaurant', 'InnBite', 'TABLE_SERVICE', 'BOTH', 'emerald', '/logo/innbite-logo.png', 'QR-COMMON-R001', 'active')
ON CONFLICT (restaurant_id) 
DO UPDATE SET 
    payment_mode = EXCLUDED.payment_mode,
    app_name = EXCLUDED.app_name,
    theme_color = EXCLUDED.theme_color,
    logo_url = EXCLUDED.logo_url;

-- Add a default Super Admin account into admins table
INSERT INTO admins (id, name, email, username, password, role, restaurant_id, status, google_email)
VALUES ('adm-super-1', 'Super Administrator', 'superadmin@innbite.com', 'superadmin', 'superadmin123', 'SUPER_ADMIN', 'R001', 'ACTIVE', 'superadmin@gmail.com')
ON CONFLICT (id) DO NOTHING;
