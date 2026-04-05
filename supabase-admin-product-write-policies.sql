-- ============================================
-- LYRA Admin Product Write Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Source of truth for the lightweight admin password used by the browser admin panel.
-- IMPORTANT: rotate this value before production and keep it aligned with VITE_ADMIN_PASSWORD.
CREATE TABLE IF NOT EXISTS public.lyra_app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.lyra_app_settings (key, value)
VALUES ('admin_password', 'lyra2024')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_lyra_admin_request()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  WITH request_headers AS (
    SELECT COALESCE(current_setting('request.headers', true), '{}')::jsonb AS headers
  )
  SELECT COALESCE(
    (SELECT headers ->> 'x-lyra-admin-password' FROM request_headers),
    ''
  ) = COALESCE(
    (SELECT value FROM public.lyra_app_settings WHERE key = 'admin_password' LIMIT 1),
    ''
  );
$$;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reseller_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "LYRA admin updates products" ON public.products;
CREATE POLICY "LYRA admin updates products"
  ON public.products
  FOR UPDATE
  TO anon, authenticated
  USING (public.is_lyra_admin_request())
  WITH CHECK (public.is_lyra_admin_request());

DROP POLICY IF EXISTS "LYRA admin updates reseller products" ON public.reseller_products;
CREATE POLICY "LYRA admin updates reseller products"
  ON public.reseller_products
  FOR UPDATE
  TO anon, authenticated
  USING (public.is_lyra_admin_request())
  WITH CHECK (public.is_lyra_admin_request());
