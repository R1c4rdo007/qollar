-- ============================================================
-- QOLLAR SCHEMA V4b
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Pet owners need to SELECT their own pet's plates
-- (was missing — caused "no plate found" even when plates exist)
DROP POLICY IF EXISTS "Pet owners can view own pet plates" ON public.qr_plates;
CREATE POLICY "Pet owners can view own pet plates"
  ON public.qr_plates FOR SELECT
  USING (
    -- Admin can see all
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    OR
    -- Authenticated users can see any plate (to activate)
    auth.role() = 'authenticated'
  );
