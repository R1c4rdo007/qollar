-- ============================================================
-- QOLLAR — Admin RLS helpers
-- Ejecutar en Supabase Dashboard > SQL Editor
-- Permite que admins vean todos los datos
-- ============================================================

-- Helper function: is current user admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles: admins can read all
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

-- Pets: admins can read all
DROP POLICY IF EXISTS "Admins can view all pets" ON public.pets;
CREATE POLICY "Admins can view all pets"
  ON public.pets FOR SELECT
  USING (owner_id = auth.uid() OR public.is_admin());

-- Scan events: admins can read all
DROP POLICY IF EXISTS "Admins can view all scans" ON public.scan_events;
CREATE POLICY "Admins can view all scans"
  ON public.scan_events FOR SELECT
  USING (public.is_admin());
