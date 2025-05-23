-- Add indexes for securities table
CREATE INDEX idx_securities_created_at ON securities(created_at);
CREATE INDEX idx_securities_updated_at ON securities(updated_at);
CREATE INDEX idx_securities_name ON securities(name);
CREATE INDEX idx_securities_price ON securities(price);
CREATE INDEX idx_securities_yield ON securities(yield);
CREATE INDEX idx_securities_sma200 ON securities(sma200);
CREATE INDEX idx_securities_tags ON securities USING GIN (tags);

-- Add indexes for dividends table
CREATE INDEX idx_dividends_created_at ON dividends(created_at);
CREATE INDEX idx_dividends_updated_at ON dividends(updated_at);
CREATE INDEX idx_dividends_amount ON dividends(amount);
CREATE INDEX idx_dividends_payment_date ON dividends(payment_date);

-- Verify the indexes were created
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('securities', 'dividends')
ORDER BY
    tablename, indexname; 