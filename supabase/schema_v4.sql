-- ============================================================
-- QOLLAR SCHEMA V4
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- 1. Allow pet owners to unlink (deactivate) their pet's plate
--    The existing policy only allows inactive→active updates.
--    This adds active→inactive for the pet owner.
-- ============================================================
DROP POLICY IF EXISTS "Pet owners can unlink plates" ON public.qr_plates;
CREATE POLICY "Pet owners can unlink plates"
  ON public.qr_plates FOR UPDATE
  USING (
    status = 'active' AND
    EXISTS (
      SELECT 1 FROM public.pets
      WHERE pets.id = qr_plates.pet_id
        AND pets.owner_id = auth.uid()
    )
  )
  WITH CHECK (status = 'inactive');

-- ============================================================
-- 2. Allow admins to delete plates (already covered by
--    "Admins can manage plates" via FOR ALL, but adding an
--    explicit DELETE policy ensures it works even if the
--    FOR ALL policy is ever replaced).
-- ============================================================
DROP POLICY IF EXISTS "Admins can delete plates" ON public.qr_plates;
CREATE POLICY "Admins can delete plates"
  ON public.qr_plates FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ============================================================
-- 3. Ensure Ricardo has admin flag set in DB
--    (required for RLS policies to work — isAdmin() in
--     config.ts only gates the frontend, not the DB)
-- ============================================================
UPDATE public.profiles
  SET is_admin = true
  WHERE email = 'ricardo.var.webdev@gmail.com';
