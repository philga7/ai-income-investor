-- Create function to get index information
CREATE OR REPLACE FUNCTION get_table_indexes(table_name text)
RETURNS TABLE (
    indexname text,
    indexdef text
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        i.indexname::text,
        i.indexdef::text
    FROM
        pg_indexes i
    WHERE
        i.schemaname = 'public'
        AND i.tablename = table_name
    ORDER BY
        i.indexname;
END;
$$ LANGUAGE plpgsql; 