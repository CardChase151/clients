-- Check which users have email tracking data
SELECT
  id,
  email,
  first_name,
  last_name,
  last_email_sent_date,
  last_email_opened_date,
  last_email_status,
  app_url
FROM users
WHERE last_email_sent_date IS NOT NULL
ORDER BY last_email_sent_date DESC;

-- If no results, check all users to see the columns exist
-- SELECT id, email, first_name, last_name, last_email_sent_date, last_email_status FROM users LIMIT 5;
