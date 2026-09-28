-- ==============================================================================
-- INNBITE SUPABASE MIGRATION SCRIPT
-- ==============================================================================
-- Instructions: 
-- 1. Open your Supabase Dashboard
-- 2. Go to the SQL Editor
-- 3. Paste and run this entire script to generate your schema and initial data
-- ==============================================================================

-- 1. Clean up existing tables (Run this ONLY if you want a completely fresh slate)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS banners;
DROP TABLE IF EXISTS tables;
DROP TABLE IF EXISTS waiters;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS restaurant_settings;

-- ==============================================================================
-- 2. Create Tables
-- ==============================================================================

-- Restaurant Settings
CREATE TABLE restaurant_settings (
    restaurant_id VARCHAR PRIMARY KEY,
    restaurant_name VARCHAR NOT NULL,
    service_mode VARCHAR NOT NULL DEFAULT 'TABLE_SERVICE',
    common_qr_code VARCHAR,
    common_qr_status VARCHAR DEFAULT 'active'
);

-- Categories
CREATE TABLE categories (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    image_url VARCHAR,
    display_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Dishes
CREATE TABLE dishes (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    preparation TEXT,
    base_price NUMERIC(10, 2) DEFAULT 0,
    category_id VARCHAR REFERENCES categories(id) ON DELETE SET NULL,
    images JSONB,
    portions JSONB,
    ingredients JSONB,
    allergens JSONB,
    taste_profile JSONB,
    is_popular BOOLEAN DEFAULT false,
    is_special BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Banners
CREATE TABLE banners (
    id VARCHAR PRIMARY KEY,
    title VARCHAR,
    image_url VARCHAR,
    dish_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tables
CREATE TABLE tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_number INT UNIQUE,
    status VARCHAR DEFAULT 'active',
    qr_code VARCHAR,
    revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR,
    restaurant_id VARCHAR REFERENCES restaurant_settings(restaurant_id),
    service_mode VARCHAR,
    table_id VARCHAR,
    table_number INT,
    session_id VARCHAR,
    customer_name VARCHAR,
    customer_phone VARCHAR,
    total_amount NUMERIC(10, 2),
    status VARCHAR DEFAULT 'CONFIRMED',
    payment_method VARCHAR,
    payment_status VARCHAR DEFAULT 'SUCCESS',
    razorpay_payment_id VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    dish_id VARCHAR,
    dish_name VARCHAR,
    unit_price NUMERIC(10, 2),
    quantity INT,
    portion_label VARCHAR,
    customizations JSONB,
    special_instruction TEXT,
    subtotal NUMERIC(10, 2)
);

-- Waiters
CREATE TABLE waiters (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE,
    password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'WAITER',
    restaurant_id VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    google_email VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Admins
CREATE TABLE admins (
    id VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    username VARCHAR UNIQUE,
    password VARCHAR NOT NULL,
    role VARCHAR DEFAULT 'ADMIN',
    restaurant_id VARCHAR,
    status VARCHAR DEFAULT 'ACTIVE',
    google_email VARCHAR,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- 3. Insert Default Data (Login Accounts & Settings)
-- ==============================================================================

-- Insert Settings
INSERT INTO restaurant_settings (restaurant_id, restaurant_name, service_mode, common_qr_code, common_qr_status)
VALUES ('R001', 'InnBite Restaurant', 'TABLE_SERVICE', 'QR-COMMON-R001', 'active');

-- Insert Demo Admin
INSERT INTO admins (id, name, email, username, password, role, restaurant_id, status, google_email)
VALUES 
('adm-1', 'Admin Manager', 'admin@innbite.com', 'admin', 'adminpassword', 'ADMIN', 'R001', 'ACTIVE', 'admin@gmail.com');

-- Insert Demo Waiters
INSERT INTO waiters (id, name, email, username, password, role, restaurant_id, status, google_email)
VALUES 
('wtr-1', 'John Waiter', 'waiter@innbite.com', 'waiter1', 'password123', 'WAITER', 'R001', 'ACTIVE', 'waiter@gmail.com'),
('wtr-2', 'Sarah Staff', 'sarah@innbite.com', 'sarah', 'password123', 'WAITER', 'R001', 'ACTIVE', 'sarah.waiter@gmail.com');

-- ==============================================================================
-- 4. Enable Realtime Sync
-- ==============================================================================
-- (Make sure realtime is enabled for your project first in Supabase settings)

-- Drop publication if it exists to reset
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE waiters;
ALTER PUBLICATION supabase_realtime ADD TABLE categories;
ALTER PUBLICATION supabase_realtime ADD TABLE dishes;


