-- ============================================
-- LYRA Reseller System - Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BRANDS
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- CATEGORIES (self-referencing for subcategories)
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- UPDATE EXISTING PRODUCTS TABLE
-- Add cost_price and suggested_price if they don't exist
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'suggested_price') THEN
    ALTER TABLE products ADD COLUMN suggested_price DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
    ALTER TABLE products ADD COLUMN slug TEXT UNIQUE;
  END IF;
END $$;

-- ============================================
-- UPDATE RESELLERS TABLE
-- Add new columns for the catalog system
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'slug') THEN
    ALTER TABLE resellers ADD COLUMN slug TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'whatsapp') THEN
    ALTER TABLE resellers ADD COLUMN whatsapp TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'bio') THEN
    ALTER TABLE resellers ADD COLUMN bio TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'avatar_url') THEN
    ALTER TABLE resellers ADD COLUMN avatar_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'catalog_title') THEN
    ALTER TABLE resellers ADD COLUMN catalog_title TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'is_active') THEN
    ALTER TABLE resellers ADD COLUMN is_active BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'paid_at') THEN
    ALTER TABLE resellers ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'expires_at') THEN
    ALTER TABLE resellers ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'settings') THEN
    ALTER TABLE resellers ADD COLUMN settings JSONB DEFAULT '{}';
  END IF;
END $$;

-- ============================================
-- RESELLER_PRODUCTS (the core relationship)
-- ============================================
CREATE TABLE IF NOT EXISTS reseller_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  custom_price DECIMAL(10,2) NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(reseller_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_rp_reseller ON reseller_products(reseller_id);
CREATE INDEX IF NOT EXISTS idx_rp_product ON reseller_products(product_id);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_resellers_slug ON resellers(slug);
CREATE INDEX IF NOT EXISTS idx_resellers_active ON resellers(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Reseller Products RLS
ALTER TABLE reseller_products ENABLE ROW LEVEL SECURITY;

-- Resellers can manage their own products
DROP POLICY IF EXISTS "Resellers manage own products" ON reseller_products;
CREATE POLICY "Resellers manage own products"
  ON reseller_products FOR ALL
  USING (auth.uid() = reseller_id);

-- Public can read visible reseller products (for catalog pages)
DROP POLICY IF EXISTS "Public reads visible reseller products" ON reseller_products;
CREATE POLICY "Public reads visible reseller products"
  ON reseller_products FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM resellers
      WHERE resellers.id = reseller_products.reseller_id
      AND resellers.is_active = true
    )
  );

-- Brands RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active brands" ON brands;
CREATE POLICY "Public can read active brands"
  ON brands FOR SELECT USING (is_active = true);

-- Categories RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read active categories" ON categories;
CREATE POLICY "Public can read active categories"
  ON categories FOR SELECT USING (is_active = true);

-- ============================================
-- HELPER FUNCTION: Generate slug from name
-- ============================================
CREATE OR REPLACE FUNCTION generate_slug(input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        translate(input, 'àáâãäåèéêëìíîïòóôõöùúûüýÿñç', 'aaaaaaeeeeiiiioooooouuuuyync'),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Auto-generate reseller slug on insert
-- ============================================
CREATE OR REPLACE FUNCTION auto_reseller_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := generate_slug(NEW.full_name);
    final_slug := base_slug;

    WHILE EXISTS (SELECT 1 FROM resellers WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;

    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reseller_slug_trigger ON resellers;
CREATE TRIGGER reseller_slug_trigger
  BEFORE INSERT OR UPDATE ON resellers
  FOR EACH ROW EXECUTE FUNCTION auto_reseller_slug();

-- ============================================
-- VIEW: Reseller earnings (for dashboard analytics)
-- ============================================
CREATE OR REPLACE VIEW reseller_earnings AS
SELECT
  o.reseller_id,
  DATE_TRUNC('day', o.created_at) as day,
  DATE_TRUNC('week', o.created_at) as week,
  DATE_TRUNC('month', o.created_at) as month,
  SUM(COALESCE(o.total_amount, 0)) as revenue,
  COUNT(DISTINCT o.id) as order_count
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY o.reseller_id, DATE_TRUNC('day', o.created_at), DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- ============================================
-- RESERVED SLUGS (prevent conflicts with routes)
-- ============================================
CREATE OR REPLACE FUNCTION check_reserved_slugs()
RETURNS TRIGGER AS $$
DECLARE
  reserved TEXT[] := ARRAY[
    'loja', 'admin', 'revendedores', 'checkout', 'sobre',
    'contacto', 'colecoes', 'politicas', 'produto', 'api',
    'explicacao', 'beneficios', 'pagamento', 'order-confirmation'
  ];
BEGIN
  IF NEW.slug = ANY(reserved) THEN
    RAISE EXCEPTION 'O slug "%" está reservado e não pode ser usado.', NEW.slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_reseller_slug ON resellers;
CREATE TRIGGER check_reseller_slug
  BEFORE INSERT OR UPDATE ON resellers
  FOR EACH ROW EXECUTE FUNCTION check_reserved_slugs();
