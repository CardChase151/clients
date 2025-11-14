-- Create email_history table to track all update emails sent to clients
CREATE TABLE IF NOT EXISTS email_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  sent_by UUID REFERENCES auth.users(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  personal_message TEXT,
  changes_snapshot JSONB,
  email_subject TEXT,
  email_sent_successfully BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE email_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_history
CREATE POLICY "Admins can view all email history"
ON email_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  )
);

CREATE POLICY "Admins can insert email history"
ON email_history FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND is_admin = true
  )
);

-- Create indexes for better performance
CREATE INDEX idx_email_history_user_project ON email_history(user_id, project_id);
CREATE INDEX idx_email_history_sent_at ON email_history(sent_at DESC);
CREATE INDEX idx_email_history_project ON email_history(project_id);
