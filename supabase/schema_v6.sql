-- ============================================================
-- QOLLAR SCHEMA V6
-- Nuevos campos en profiles: age, gender, bio, theme_preference
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS theme_preference text DEFAULT 'dark' NOT NULL;
