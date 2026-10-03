-- Sadiqabad City Phone Directory Schema
-- PostgreSQL + Supabase Schema with RLS and pg_trgm Search

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL,
    name_ur VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) NOT NULL DEFAULT 'Building2',
    color VARCHAR(30) NOT NULL DEFAULT '#0F766E',
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AREAS TABLE
CREATE TABLE IF NOT EXISTS areas (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(120) NOT NULL,
    name_ur VARCHAR(120) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    name_ur VARCHAR(200),
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    area_id INTEGER NOT NULL REFERENCES areas(id) ON DELETE RESTRICT,
    description TEXT,
    address TEXT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    whatsapp VARCHAR(50),
    website VARCHAR(255),
    email VARCHAR(150),
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    google_maps_url TEXT,
    place_id VARCHAR(150),
    rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0 CHECK (rating >= 1.0 AND rating <= 5.0),
    reviews_count INTEGER NOT NULL DEFAULT 0 CHECK (reviews_count >= 0),
    opening_hours JSONB DEFAULT '{}'::jsonb,
    image_url TEXT,
    gallery TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    views_count INTEGER NOT NULL DEFAULT 0 CHECK (views_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PERFORMANCE & SEARCH INDEXES
CREATE INDEX IF NOT EXISTS idx_businesses_category_id ON businesses(category_id);
CREATE INDEX IF NOT EXISTS idx_businesses_area_id ON businesses(area_id);
CREATE INDEX IF NOT EXISTS idx_businesses_is_active ON businesses(is_active);
CREATE INDEX IF NOT EXISTS idx_businesses_is_featured ON businesses(is_featured);
CREATE INDEX IF NOT EXISTS idx_businesses_rating ON businesses(rating DESC);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_areas_slug ON areas(slug);

-- Trigram GIN indexes for typo-tolerant fuzzy search
CREATE INDEX IF NOT EXISTS idx_businesses_trgm_name ON businesses USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_businesses_trgm_address ON businesses USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_businesses_search_composite ON businesses USING gin ((name || ' ' || COALESCE(name_ur, '') || ' ' || address) gin_trgm_ops);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Allow public read access to categories
CREATE POLICY "Allow public read access to categories"
ON categories FOR SELECT
USING (true);

-- Allow public read access to areas
CREATE POLICY "Allow public read access to areas"
ON areas FOR SELECT
USING (true);

-- Allow public read access ONLY to active businesses
CREATE POLICY "Allow public read access to active businesses"
ON businesses FOR SELECT
USING (is_active = true);

-- Block public insert/update/delete (Admin role will be configured in Part 2)
CREATE POLICY "Block anonymous inserts on businesses"
ON businesses FOR INSERT
WITH CHECK (false);

CREATE POLICY "Block anonymous updates on businesses"
ON businesses FOR UPDATE
USING (false);

CREATE POLICY "Block anonymous deletes on businesses"
ON businesses FOR DELETE
USING (false);

-- 6. STORED PROCEDURES / FUNCTIONS
-- Safe public function to increment views count without giving full UPDATE privileges
CREATE OR REPLACE FUNCTION increment_views_count(business_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE businesses
    SET views_count = views_count + 1
    WHERE id = business_id AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-update updated_at timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
BEFORE UPDATE ON businesses
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
