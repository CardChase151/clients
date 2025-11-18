-- Add email tracking columns to email_history table
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS email_id TEXT;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS email_status TEXT CHECK (email_status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'));
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_history ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN email_history.email_id IS 'Resend email ID for webhook tracking';
COMMENT ON COLUMN email_history.email_status IS 'Current status of this specific email';
COMMENT ON COLUMN email_history.opened_at IS 'When this email was opened';
COMMENT ON COLUMN email_history.clicked_at IS 'When a link in this email was clicked';
COMMENT ON COLUMN email_history.bounced_at IS 'When this email bounced';

-- Create index for faster webhook lookups by email_id
CREATE INDEX IF NOT EXISTS idx_email_history_email_id ON email_history(email_id);
