-- Add app_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS app_url TEXT;

-- Add email tracking columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_sent_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_opened_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_email_status TEXT CHECK (last_email_status IN ('sent', 'delivered', 'opened', 'clicked'));

-- Add comment for documentation
COMMENT ON COLUMN users.app_url IS 'User app URL (e.g., their Netlify deployment) - included in update emails';
COMMENT ON COLUMN users.last_email_sent_date IS 'Date of most recent email sent to user';
COMMENT ON COLUMN users.last_email_opened_date IS 'Date when user last opened an email';
COMMENT ON COLUMN users.last_email_status IS 'Status of most recent email: sent, delivered, opened, or clicked';
