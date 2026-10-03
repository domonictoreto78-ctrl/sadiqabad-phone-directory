-- ==============================================================================
-- Sadiqabad City Phone Directory - Part 3 SQL Migration
-- Run this script in your Supabase SQL Editor.
-- Safe to re-run (uses IF NOT EXISTS and DROP POLICY IF EXISTS).
-- ==============================================================================

-- 1. ADD NEW COLUMNS TO businesses FOR GOOGLE MAPS / REAL EXCEL IMPORT
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS price_range TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS timing_text TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_category TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plus_code TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS google_feature_id TEXT;

-- 2. UNIQUE INDEX ON google_feature_id FOR BULK IMPORT DEDUPLICATION
CREATE UNIQUE INDEX IF NOT EXISTS idx_businesses_google_feature_id_unique
ON businesses (google_feature_id)
WHERE google_feature_id IS NOT NULL AND google_feature_id != '';

-- Also index google_category for fast grouping & filtering
CREATE INDEX IF NOT EXISTS idx_businesses_google_category
ON businesses (google_category)
WHERE google_category IS NOT NULL;

-- 3. SEARCH LOGS TABLE & RLS
-- Tracks public queries, AI parsed filters, results count, and language
CREATE TABLE IF NOT EXISTS search_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query TEXT NOT NULL,
    parsed_filters JSONB DEFAULT '{}'::jsonb,
    results_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_logs_created_at ON search_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_logs_results_count ON search_logs (results_count);
CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs USING gin (query gin_trgm_ops);

ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can insert search logs (anonymous public search or logged-in users)
DROP POLICY IF EXISTS "Anyone can insert search_logs" ON search_logs;
CREATE POLICY "Anyone can insert search_logs"
ON search_logs FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can view search_logs
DROP POLICY IF EXISTS "Only admins can select search_logs" ON search_logs;
CREATE POLICY "Only admins can select search_logs"
ON search_logs FOR SELECT
TO authenticated
USING (is_admin());

-- 4. CHAT LOGS TABLE & RLS
-- Stores AI conversation interactions, user queries, answers, and business candidates
CREATE TABLE IF NOT EXISTS chat_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_message TEXT NOT NULL,
    answer TEXT NOT NULL,
    business_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_logs_created_at ON chat_logs (created_at DESC);

ALTER TABLE chat_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view chat_logs
DROP POLICY IF EXISTS "Only admins can select chat_logs" ON chat_logs;
CREATE POLICY "Only admins can select chat_logs"
ON chat_logs FOR SELECT
TO authenticated
USING (is_admin());

-- Server can insert chat logs (or authenticated admin)
DROP POLICY IF EXISTS "Server and admins can insert chat_logs" ON chat_logs;
CREATE POLICY "Server and admins can insert chat_logs"
ON chat_logs FOR INSERT
TO public
WITH CHECK (true);
