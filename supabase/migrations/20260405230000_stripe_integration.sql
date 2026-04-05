-- ============================================
-- LYRA Stripe Integration
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'payment_status') THEN
    ALTER TABLE resellers ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'payment_gateway') THEN
    ALTER TABLE resellers ADD COLUMN payment_gateway TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE resellers ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE resellers ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resellers' AND column_name = 'checkout_completed_at') THEN
    ALTER TABLE resellers ADD COLUMN checkout_completed_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'stripe_customer_id') THEN
    ALTER TABLE customers ADD COLUMN stripe_customer_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal_amount') THEN
    ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10,2);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status') THEN
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_gateway') THEN
    ALTER TABLE orders ADD COLUMN payment_gateway TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_checkout_session_id') THEN
    ALTER TABLE orders ADD COLUMN stripe_checkout_session_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_payment_intent_id') THEN
    ALTER TABLE orders ADD COLUMN stripe_payment_intent_id TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'paid_at') THEN
    ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resellers_stripe_checkout_session
  ON resellers(stripe_checkout_session_id);

CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_session
  ON orders(stripe_checkout_session_id);
