-- Add new optional fields to the 'dishes' table
-- This adds the exact fields used by the updated Admin menu and Food Details page

ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS preparation text,
ADD COLUMN IF NOT EXISTS portions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ingredients_list jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS allergens jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS taste_profile jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb;
