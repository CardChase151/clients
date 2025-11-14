-- Update milestone columns to use status-based fields
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS discovery_status VARCHAR(20) DEFAULT 'not_sent',
ADD COLUMN IF NOT EXISTS discovery_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS proposal_sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(20) DEFAULT 'not_sent',
ADD COLUMN IF NOT EXISTS invoice_sent_date TIMESTAMP WITH TIME ZONE;

-- Add comments to explain these columns
COMMENT ON COLUMN public.users.discovery_status IS 'Discovery period status: not_sent, sent, paid, waived';
COMMENT ON COLUMN public.users.proposal_status IS 'Proposal status: sent, reviewed';
COMMENT ON COLUMN public.users.invoice_status IS 'Invoice status: not_sent, sent, paid, waived';

-- Migrate existing data from boolean fields to new status fields
UPDATE public.users
SET discovery_status =
  CASE
    WHEN discovery_payment_type = 'paid' THEN 'paid'
    WHEN discovery_payment_type = 'waived' THEN 'waived'
    WHEN discovery_complete = true THEN 'sent'
    ELSE 'not_sent'
  END
WHERE discovery_status = 'not_sent';

UPDATE public.users
SET invoice_status =
  CASE
    WHEN invoice_payment_type = 'paid' THEN 'paid'
    WHEN invoice_payment_type = 'waived' THEN 'waived'
    WHEN invoice_fulfilled = true THEN 'sent'
    ELSE 'not_sent'
  END
WHERE invoice_status = 'not_sent';
