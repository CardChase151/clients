-- Check the most recent email with all join data
SELECT 
  eh.id,
  eh.sent_at,
  eh.email_subject,
  eh.user_id,
  u.email as user_email,
  u.first_name,
  u.last_name,
  u.last_email_status,
  p.name as project_name
FROM email_history eh
LEFT JOIN users u ON u.id = eh.user_id
LEFT JOIN projects p ON p.id = eh.project_id
ORDER BY eh.sent_at DESC
LIMIT 5;
