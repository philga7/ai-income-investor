-- Create dividends table
CREATE TABLE IF NOT EXISTS dividends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    security_id UUID NOT NULL REFERENCES securities(id) ON DELETE CASCADE,
    amount DECIMAL(10, 4) NOT NULL,
    ex_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_dividends_security_id ON dividends(security_id);
CREATE INDEX IF NOT EXISTS idx_dividends_ex_date ON dividends(ex_date);
CREATE INDEX IF NOT EXISTS idx_dividends_payment_date ON dividends(payment_date);

-- Add RLS policies
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

-- Allow users to view dividends for securities in their portfolios
CREATE POLICY "Users can view dividends for their portfolio securities"
    ON dividends
    FOR SELECT
    USING (
        security_id IN (
            SELECT ps.security_id
            FROM portfolio_securities ps
            JOIN portfolios p ON p.id = ps.portfolio_id
            WHERE p.user_id = auth.uid()
        )
    );

-- Allow users to insert/update dividends for securities in their portfolios
CREATE POLICY "Users can manage dividends for their portfolio securities"
    ON dividends
    FOR ALL
    USING (
        security_id IN (
            SELECT ps.security_id
            FROM portfolio_securities ps
            JOIN portfolios p ON p.id = ps.portfolio_id
            WHERE p.user_id = auth.uid()
        )
    );

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_dividends_updated_at ON dividends;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_dividends_updated_at
    BEFORE UPDATE ON dividends
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); 