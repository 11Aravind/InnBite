-- Add is_closed boolean to restaurant_settings table
ALTER TABLE restaurant_settings 
ADD COLUMN is_closed BOOLEAN DEFAULT false;
