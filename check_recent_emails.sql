-- Check most recent emails in email_history
SELECT 
  id,
  sent_at,
  email_subject,
  email_sent_successfully,
  user_id,
  project_id
FROM email_history
ORDER BY sent_at DESC
LIMIT 10;
