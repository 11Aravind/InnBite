# Schema Migration Rules

1. **Always use separate migration files**: Never modify existing schema setup or migration files (e.g., `supabase_schema.sql` or `001_initial_schema.sql`) when applying new database changes or fixes.
2. **Sequential Naming**: Always create a completely new, sequentially named migration file (e.g., `002_grant_api_access.sql`, `003_add_new_column.sql`) for any structural change, permission fix, or data insertion.
