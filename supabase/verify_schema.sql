-- Check tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public'
    AND table_name IN ('profiles', 'portfolios', 'securities', 'portfolio_securities', 'dividends')
ORDER BY 
    table_name, ordinal_position;

-- Check indexes
SELECT 
    tablename,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname = 'public'
    AND tablename IN ('profiles', 'portfolios', 'securities', 'portfolio_securities', 'dividends')
ORDER BY 
    tablename, indexname;

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
FROM 
    pg_policies
WHERE 
    schemaname = 'public'
    AND tablename IN ('profiles', 'portfolios', 'securities', 'portfolio_securities', 'dividends')
ORDER BY 
    tablename, policyname;

-- Check triggers
SELECT 
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement as definition
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'public'
    AND event_object_table IN ('profiles', 'portfolios', 'securities', 'portfolio_securities', 'dividends')
ORDER BY 
    event_object_table, trigger_name; 