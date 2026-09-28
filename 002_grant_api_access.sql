-- ==============================================================================
-- 002: Explicitly Grant API Access (Fix for 401 Unauthorized)
-- ==============================================================================
-- Ensures the anonymous and authenticated roles can access the tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
