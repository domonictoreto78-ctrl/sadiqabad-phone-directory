-- ==============================================================================
-- Sadiqabad City Phone Directory - Part 2 Admin SQL Migration
-- Run this script in your Supabase SQL Editor to enable Admin Auth, RLS, Storage,
-- Activity Logs, and Import Batches.
-- ==============================================================================

-- 1. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS admin_users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'editor')) DEFAULT 'editor',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for role lookup
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);

-- 2. SECURITY DEFINER HELPER FUNCTIONS
-- Check if current authenticated caller is an admin (either super_admin or editor)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid()
    );
$$;

-- Check if current authenticated caller is a super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM admin_users
        WHERE user_id = auth.uid() AND role = 'super_admin'
    );
$$;

-- 3. ACTIVITY LOGS & IMPORT BATCHES TABLES
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_entity ON admin_logs(entity);

CREATE TABLE IF NOT EXISTS import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT,
    file_name TEXT NOT NULL,
    total_rows INTEGER NOT NULL DEFAULT 0,
    inserted INTEGER NOT NULL DEFAULT 0,
    updated INTEGER NOT NULL DEFAULT 0,
    skipped INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'completed',
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_created_at ON import_batches(created_at DESC);

-- 4. UNIQUE INDEX ON businesses(place_id) FOR DEDUPLICATION
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_place_id_unique
ON businesses (place_id)
WHERE place_id IS NOT NULL AND place_id != '';

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all newly created tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- ADMIN_USERS POLICIES:
-- Admins can view admin users
DROP POLICY IF EXISTS "Admins can view admin_users" ON admin_users;
CREATE POLICY "Admins can view admin_users"
ON admin_users FOR SELECT
TO authenticated
USING (is_admin());

-- Only Super Admins can insert/update/delete admin users
DROP POLICY IF EXISTS "Super admins can insert admin_users" ON admin_users;
CREATE POLICY "Super admins can insert admin_users"
ON admin_users FOR INSERT
TO authenticated
WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can update admin_users" ON admin_users;
CREATE POLICY "Super admins can update admin_users"
ON admin_users FOR UPDATE
TO authenticated
USING (is_super_admin())
WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "Super admins can delete admin_users" ON admin_users;
CREATE POLICY "Super admins can delete admin_users"
ON admin_users FOR DELETE
TO authenticated
USING (is_super_admin());

-- ADMIN_LOGS POLICIES:
DROP POLICY IF EXISTS "Admins can read admin_logs" ON admin_logs;
CREATE POLICY "Admins can read admin_logs"
ON admin_logs FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert admin_logs" ON admin_logs;
CREATE POLICY "Admins can insert admin_logs"
ON admin_logs FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- IMPORT_BATCHES POLICIES:
DROP POLICY IF EXISTS "Admins can read import_batches" ON import_batches;
CREATE POLICY "Admins can read import_batches"
ON import_batches FOR SELECT
TO authenticated
USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert import_batches" ON import_batches;
CREATE POLICY "Admins can insert import_batches"
ON import_batches FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- BUSINESSES POLICIES:
-- Public can select active businesses; Admins can select ALL businesses (including inactive)
DROP POLICY IF EXISTS "Allow public read access to active businesses" ON businesses;
DROP POLICY IF EXISTS "Public and admins can view businesses" ON businesses;
CREATE POLICY "Public and admins can view businesses"
ON businesses FOR SELECT
USING (is_active = true OR is_admin());

-- Admins can insert, update, delete businesses
DROP POLICY IF EXISTS "Block anonymous inserts on businesses" ON businesses;
DROP POLICY IF EXISTS "Block anonymous updates on businesses" ON businesses;
DROP POLICY IF EXISTS "Block anonymous deletes on businesses" ON businesses;

DROP POLICY IF EXISTS "Admins can insert businesses" ON businesses;
CREATE POLICY "Admins can insert businesses"
ON businesses FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update businesses" ON businesses;
CREATE POLICY "Admins can update businesses"
ON businesses FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can delete businesses" ON businesses;
CREATE POLICY "Admins can delete businesses"
ON businesses FOR DELETE
TO authenticated
USING (is_admin());

-- CATEGORIES POLICIES:
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only Super Admins can delete categories (Editors cannot delete categories)
DROP POLICY IF EXISTS "Super admins can delete categories" ON categories;
CREATE POLICY "Super admins can delete categories"
ON categories FOR DELETE
TO authenticated
USING (is_super_admin());

-- AREAS POLICIES:
DROP POLICY IF EXISTS "Admins can insert areas" ON areas;
CREATE POLICY "Admins can insert areas"
ON areas FOR INSERT
TO authenticated
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update areas" ON areas;
CREATE POLICY "Admins can update areas"
ON areas FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Only Super Admins can delete areas (Editors cannot delete areas)
DROP POLICY IF EXISTS "Super admins can delete areas" ON areas;
CREATE POLICY "Super admins can delete areas"
ON areas FOR DELETE
TO authenticated
USING (is_super_admin());

-- 6. PUBLIC STORAGE BUCKET: business-images
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-images', 'business-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage object policies
DROP POLICY IF EXISTS "Public can view business images" ON storage.objects;
CREATE POLICY "Public can view business images"
ON storage.objects FOR SELECT
USING (bucket_id = 'business-images');

DROP POLICY IF EXISTS "Admins can upload business images" ON storage.objects;
CREATE POLICY "Admins can upload business images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can update business images" ON storage.objects;
CREATE POLICY "Admins can update business images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'business-images' AND is_admin())
WITH CHECK (bucket_id = 'business-images' AND is_admin());

DROP POLICY IF EXISTS "Admins can delete business images" ON storage.objects;
CREATE POLICY "Admins can delete business images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'business-images' AND is_admin());

-- ==============================================================================
-- HOW TO MAKE YOURSELF SUPER_ADMIN:
-- 1. In Supabase Dashboard -> Authentication -> Users, click "Add User" (or sign up
--    at your app). For example: admin@sadiqabad.city with your password.
-- 2. Once created, copy the user's UUID from the Users table.
-- 3. Run the following statement in this SQL editor:
--
--    INSERT INTO public.admin_users (user_id, email, role)
--    VALUES ('PASTE-YOUR-USER-UUID-HERE', 'admin@sadiqabad.city', 'super_admin')
--    ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';
--
-- 4. Now visit your web app at #/admin/login and sign in!
-- ==============================================================================
