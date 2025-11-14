-- Check if triggers exist
SELECT
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND trigger_name IN ('task_update_trigger', 'task_insert_trigger', 'screen_update_trigger')
ORDER BY event_object_table, trigger_name;

-- Also check the functions exist
SELECT
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('log_task_change', 'log_screen_change')
ORDER BY routine_name;
