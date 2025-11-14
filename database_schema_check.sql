-- Check all tables and their columns
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('projects', 'screens', 'tasks', 'users')
ORDER BY table_name, ordinal_position;

-- Check foreign key constraints
SELECT
    tc.table_name,
    kcu.column_name,
    tc.constraint_name,
    tc.constraint_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'public'
    AND tc.table_name IN ('projects', 'screens', 'tasks')
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- Check RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'screens', 'tasks', 'users')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('projects', 'screens', 'tasks', 'users')
ORDER BY tablename;
