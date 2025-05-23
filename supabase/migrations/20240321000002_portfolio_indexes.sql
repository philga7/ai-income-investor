-- Add indexes for portfolios table
CREATE INDEX idx_portfolios_created_at ON portfolios(created_at);
CREATE INDEX idx_portfolios_updated_at ON portfolios(updated_at);

-- Verify the indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename = 'portfolios'
ORDER BY
    indexname; 