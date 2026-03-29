-- ============================================================
-- QOLLAR SCHEMA V5
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Pets no longer need an auto-generated qr_id.
-- The only public identifier is the physical plate's plate_code.
-- Make qr_id nullable and remove the default so new pets start without one.

ALTER TABLE public.pets ALTER COLUMN qr_id DROP NOT NULL;
ALTER TABLE public.pets ALTER COLUMN qr_id DROP DEFAULT;

-- Existing pets already have a qr_id — leave them as-is.
-- The /pet/[qrId] page now looks up via qr_plates.plate_code first,
-- then falls back to pets.qr_id for backward compatibility.
