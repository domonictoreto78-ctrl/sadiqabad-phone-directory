-- ==============================================================================
-- Sadiqabad City Phone Directory - Part 4 SQL Migration
-- Run this script in your Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS and DROP POLICY IF EXISTS everywhere).
-- ==============================================================================

-- 1. ADD SLUG COLUMN TO BUSINESSES (for clean SEO URLs)
ALTER TABLE IF EXISTS public.businesses
  ADD COLUMN IF NOT EXISTS slug text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_slug
  ON public.businesses (slug)
  WHERE slug IS NOT NULL;

-- Backfill slugs for existing businesses that lack one
UPDATE public.businesses
SET slug = lower(
  regexp_replace(
    regexp_replace(trim(name), '[^a-zA-Z0-9\s-]', '', 'g'),
    '\s+', '-', 'g'
  )
) || '-' || substr(id::text, 1, 6)
WHERE slug IS NULL;


-- 2. REVIEWS TABLE (Community Ratings & Testimonials)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text CHECK (comment IS NULL OR length(comment) <= 500),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews(business_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- RLS for reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view approved reviews" ON public.reviews;
CREATE POLICY "Public can view approved reviews"
  ON public.reviews
  FOR SELECT
  USING (status = 'approved');

DROP POLICY IF EXISTS "Public can submit pending reviews" ON public.reviews;
CREATE POLICY "Public can submit pending reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND rating >= 1
    AND rating <= 5
    AND (comment IS NULL OR length(comment) <= 500)
  );

DROP POLICY IF EXISTS "Admins have full access to reviews" ON public.reviews;
CREATE POLICY "Admins have full access to reviews"
  ON public.reviews
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- 3. SUBMISSIONS TABLE (New Businesses, Corrections, Claims & Phone Suggestions)
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('new_business', 'claim_business', 'correction', 'phone_suggestion')),
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  contact_name text,
  contact_phone text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for submissions
CREATE INDEX IF NOT EXISTS idx_submissions_type ON public.submissions(type);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_business_id ON public.submissions(business_id);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);

-- RLS for submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can submit pending requests" ON public.submissions;
CREATE POLICY "Public can submit pending requests"
  ON public.submissions
  FOR INSERT
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "Admins can view and manage submissions" ON public.submissions;
CREATE POLICY "Admins can view and manage submissions"
  ON public.submissions
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());


-- 4. EMERGENCY CONTACTS TABLE (Helplines & Disaster Rescue)
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_ur text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_active ON public.emergency_contacts(is_active, sort_order ASC);

-- RLS for emergency contacts
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Public can view active emergency contacts"
  ON public.emergency_contacts
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage emergency contacts" ON public.emergency_contacts;
CREATE POLICY "Admins can manage emergency contacts"
  ON public.emergency_contacts
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Seed ONLY standard nationwide emergency helplines (Admins will add local Sadiqabad facilities)
INSERT INTO public.emergency_contacts (name_en, name_ur, phone, category, sort_order, is_active)
VALUES
  ('Rescue 1122', 'ریسکیو 1122', '1122', 'Emergency Rescue', 1, true),
  ('Police Helpline', 'پولیس ہیلپ لائن 15', '15', 'Law & Order', 2, true),
  ('Fire Brigade', 'فائر بریگیڈ 16', '16', 'Fire & Rescue', 3, true),
  ('Edhi Ambulance', 'ایدھی ایمبولینس سروس', '115', 'Medical & Relief', 4, true)
ON CONFLICT DO NOTHING;


-- 5. BUSINESS EVENTS TABLE (Privacy-Friendly Lightweight Analytics)
CREATE TABLE IF NOT EXISTS public.business_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('view', 'call', 'whatsapp', 'directions', 'share', 'favorite')),
  session_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for business events
CREATE INDEX IF NOT EXISTS idx_business_events_business_id ON public.business_events(business_id);
CREATE INDEX IF NOT EXISTS idx_business_events_type_created ON public.business_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_events_created_at ON public.business_events(created_at DESC);

-- RLS for business events
ALTER TABLE public.business_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can record business events" ON public.business_events;
CREATE POLICY "Public can record business events"
  ON public.business_events
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view business events" ON public.business_events;
CREATE POLICY "Admins can view business events"
  ON public.business_events
  FOR SELECT
  USING (is_admin());


-- 6. COMMUNITY REVIEWS SUMMARY VIEW & HELPER FUNCTION
CREATE OR REPLACE VIEW public.business_reviews_summary AS
SELECT
  business_id,
  count(*)::integer AS site_reviews_count,
  round(avg(rating)::numeric, 1)::float AS site_rating
FROM public.reviews
WHERE status = 'approved'
GROUP BY business_id;

GRANT SELECT ON public.business_reviews_summary TO anon, authenticated;

-- Function to get review summary for a single business
CREATE OR REPLACE FUNCTION public.get_business_reviews_summary(p_business_id uuid)
RETURNS TABLE (
  site_reviews_count integer,
  site_rating float
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    coalesce(count(*)::integer, 0) AS site_reviews_count,
    coalesce(round(avg(rating)::numeric, 1)::float, 0.0) AS site_rating
  FROM public.reviews
  WHERE business_id = p_business_id AND status = 'approved';
$$;

GRANT EXECUTE ON FUNCTION public.get_business_reviews_summary(uuid) TO anon, authenticated;
