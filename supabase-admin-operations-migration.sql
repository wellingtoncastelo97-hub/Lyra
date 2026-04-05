-- ============================================
-- LYRA Admin Operations + Future Stripe Support
-- Run this in Supabase SQL Editor
-- ============================================

-- Orders: financial snapshot + payment tracking
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'currency') THEN
    ALTER TABLE orders ADD COLUMN currency TEXT DEFAULT 'EUR';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal_amount') THEN
    ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_amount') THEN
    ALTER TABLE orders ADD COLUMN shipping_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_gateway') THEN
    ALTER TABLE orders ADD COLUMN payment_gateway TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_reference') THEN
    ALTER TABLE orders ADD COLUMN payment_reference TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE orders ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'supplier_cost_amount') THEN
    ALTER TABLE orders ADD COLUMN supplier_cost_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'lyra_base_amount') THEN
    ALTER TABLE orders ADD COLUMN lyra_base_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'lyra_profit_amount') THEN
    ALTER TABLE orders ADD COLUMN lyra_profit_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'reseller_profit_amount') THEN
    ALTER TABLE orders ADD COLUMN reseller_profit_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'financial_snapshot') THEN
    ALTER TABLE orders ADD COLUMN financial_snapshot JSONB DEFAULT '{}'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payout_status') THEN
    ALTER TABLE orders ADD COLUMN payout_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
    ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'fulfilled_at') THEN
    ALTER TABLE orders ADD COLUMN fulfilled_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payout_ready_at') THEN
    ALTER TABLE orders ADD COLUMN payout_ready_at TIMESTAMPTZ;
  END IF;
END $$;

-- Order items: line-level snapshot for historic profitability
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'product_name_at_time') THEN
    ALTER TABLE order_items ADD COLUMN product_name_at_time TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'sku_at_time') THEN
    ALTER TABLE order_items ADD COLUMN sku_at_time TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'supplier_cost_at_time') THEN
    ALTER TABLE order_items ADD COLUMN supplier_cost_at_time DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'lyra_cost_at_time') THEN
    ALTER TABLE order_items ADD COLUMN lyra_cost_at_time DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'lyra_profit_at_time') THEN
    ALTER TABLE order_items ADD COLUMN lyra_profit_at_time DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'reseller_profit_at_time') THEN
    ALTER TABLE order_items ADD COLUMN reseller_profit_at_time DECIMAL(10,2);
  END IF;
END $$;

-- Resellers: payout setup + future Stripe data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'payout_method') THEN
    ALTER TABLE resellers ADD COLUMN payout_method TEXT DEFAULT 'manual';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'payout_email') THEN
    ALTER TABLE resellers ADD COLUMN payout_email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'payout_iban') THEN
    ALTER TABLE resellers ADD COLUMN payout_iban TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'pending_payout_amount') THEN
    ALTER TABLE resellers ADD COLUMN pending_payout_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'total_payouts_amount') THEN
    ALTER TABLE resellers ADD COLUMN total_payouts_amount DECIMAL(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'last_payout_at') THEN
    ALTER TABLE resellers ADD COLUMN last_payout_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE resellers ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'stripe_connected_account_id') THEN
    ALTER TABLE resellers ADD COLUMN stripe_connected_account_id TEXT;
  END IF;
END $$;

-- Reseller payouts ledger
CREATE TABLE IF NOT EXISTS reseller_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  status TEXT DEFAULT 'pending',
  reference TEXT,
  notes TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payout_status ON orders(payout_status);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_reseller_payouts_reseller ON reseller_payouts(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_payouts_status ON reseller_payouts(status);

-- View for admin finance screens
CREATE OR REPLACE VIEW admin_reseller_finance AS
SELECT
  r.id AS reseller_id,
  r.full_name,
  r.email,
  r.slug,
  COUNT(DISTINCT o.id) FILTER (WHERE o.status <> 'cancelled') AS total_orders,
  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status <> 'cancelled'), 0) AS gross_sales,
  COALESCE(SUM(o.lyra_profit_amount) FILTER (WHERE o.status <> 'cancelled'), 0) AS lyra_profit,
  COALESCE(SUM(o.reseller_profit_amount) FILTER (WHERE o.status <> 'cancelled'), 0) AS reseller_profit,
  COALESCE(SUM(o.reseller_profit_amount) FILTER (WHERE o.payout_status = 'ready'), 0) AS payout_ready
FROM resellers r
LEFT JOIN orders o ON o.reseller_id = r.id
GROUP BY r.id, r.full_name, r.email, r.slug;
