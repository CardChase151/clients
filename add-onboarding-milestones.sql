-- Add onboarding milestone columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS discovery_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS discovery_complete_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS proposal_reviewed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS proposal_reviewed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invoice_fulfilled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_fulfilled_date TIMESTAMP WITH TIME ZONE;

-- Add comment to explain these columns
COMMENT ON COLUMN public.users.discovery_complete IS 'Initial discovery period complete';
COMMENT ON COLUMN public.users.proposal_reviewed IS 'Proposal reviewed by client';
COMMENT ON COLUMN public.users.invoice_fulfilled IS 'Invoice paid and fulfilled';
