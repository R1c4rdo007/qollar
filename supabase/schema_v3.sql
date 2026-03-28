-- ============================================================
-- QOLLAR DATABASE SCHEMA V3
-- Ejecutar DESPUÉS de schema_v2.sql en: Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- UPDATE PETS: nuevos campos de salud y personalidad
-- ============================================================
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS conditions text,
  ADD COLUMN IF NOT EXISTS is_sterilized boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS is_dewormed boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS special_diet text,
  ADD COLUMN IF NOT EXISTS vet_name text,
  ADD COLUMN IF NOT EXISTS vet_phone text,
  ADD COLUMN IF NOT EXISTS personality_notes text,
  ADD COLUMN IF NOT EXISTS usual_location text;

-- ============================================================
-- VACCINES (historial de vacunas por mascota)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vaccines (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  pet_id uuid REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  date_given date,
  next_due_date date,
  notes text,
  is_given boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.vaccines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet owner can manage vaccines"
  ON public.vaccines FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.pets WHERE id = pet_id AND owner_id = auth.uid())
  );

CREATE POLICY "Anyone can view vaccines"
  ON public.vaccines FOR SELECT USING (true);

-- ============================================================
-- STORIES (historias 24h estilo Instagram)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pet_id uuid REFERENCES public.pets(id) ON DELETE SET NULL,
  media_url text NOT NULL,
  caption text,
  views_count integer DEFAULT 0 NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active stories"
  ON public.stories FOR SELECT USING (expires_at > now());

CREATE POLICY "Authenticated users can create stories"
  ON public.stories FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own stories"
  ON public.stories FOR DELETE USING (auth.uid() = user_id);

-- Story views (para saber quién vio)
CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  story_id uuid REFERENCES public.stories(id) ON DELETE CASCADE NOT NULL,
  viewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(story_id, viewer_id)
);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can track views"
  ON public.story_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "Story owner can see views"
  ON public.story_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.stories WHERE id = story_id AND user_id = auth.uid())
    OR viewer_id = auth.uid()
  );

-- ============================================================
-- FUNCTION: check vaccine reminders (llamar desde el dashboard)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_vaccine_reminders(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT v.id, v.name, v.next_due_date, p.name AS pet_name, p.id AS pet_id
    FROM public.vaccines v
    JOIN public.pets p ON p.id = v.pet_id
    WHERE p.owner_id = p_user_id
      AND v.next_due_date IS NOT NULL
      AND v.next_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND NOT v.is_given
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications n
        WHERE n.user_id = p_user_id
          AND n.type = 'vaccine_reminder'
          AND (n.data->>'vaccine_id') = v.id::text
          AND n.created_at > now() - INTERVAL '24 hours'
      )
  LOOP
    INSERT INTO public.notifications (user_id, type, title, message, data)
    VALUES (
      p_user_id,
      'vaccine_reminder',
      '💉 Vacuna próxima: ' || v_rec.pet_name,
      'La vacuna "' || v_rec.name || '" vence el ' || to_char(v_rec.next_due_date, 'DD/MM/YYYY'),
      jsonb_build_object(
        'pet_id', v_rec.pet_id,
        'vaccine_id', v_rec.id,
        'vaccine_name', v_rec.name,
        'due_date', v_rec.next_due_date
      )
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Allow inserting notifications from pet owner (for vaccine reminders)
-- ============================================================
CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id OR true);
