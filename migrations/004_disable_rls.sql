-- ==============================================================================
-- 004: Disable RLS (Row Level Security)
-- ==============================================================================
-- Since the application manages authentication internally via API service calls
-- rather than Supabase Auth (auth.users), RLS must be disabled so the anon key
-- can successfully query the admins and waiters tables.

ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE waiters DISABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE dishes DISABLE ROW LEVEL SECURITY;
ALTER TABLE banners DISABLE ROW LEVEL SECURITY;
ALTER TABLE tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;
