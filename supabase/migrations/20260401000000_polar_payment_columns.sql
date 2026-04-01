-- Add Polar.sh payment tracking columns to payments table
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS polar_checkout_id text,
  ADD COLUMN IF NOT EXISTS polar_order_id    text;

-- Index for idempotency check in webhook
CREATE INDEX IF NOT EXISTS payments_polar_order_id_idx
  ON public.payments (polar_order_id)
  WHERE polar_order_id IS NOT NULL;
