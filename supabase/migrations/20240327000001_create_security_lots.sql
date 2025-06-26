-- Create security_lots table for tracking individual purchase lots
CREATE TABLE IF NOT EXISTS public.security_lots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
    security_id UUID REFERENCES securities(id) ON DELETE CASCADE NOT NULL,
    open_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_per_share DECIMAL(10,2) NOT NULL CHECK (price_per_share > 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_security_lots_portfolio_id ON security_lots(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_security_lots_security_id ON security_lots(security_id);
CREATE INDEX IF NOT EXISTS idx_security_lots_portfolio_security ON security_lots(portfolio_id, security_id);
CREATE INDEX IF NOT EXISTS idx_security_lots_open_date ON security_lots(open_date);

-- Enable RLS (idempotent - safe to run multiple times)
ALTER TABLE public.security_lots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Users can view their portfolio lots" ON security_lots;
DROP POLICY IF EXISTS "Users can manage their portfolio lots" ON security_lots;

-- Create RLS policies (idempotent)
CREATE POLICY "Users can view their portfolio lots"
    ON security_lots FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = security_lots.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their portfolio lots"
    ON security_lots FOR ALL
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = security_lots.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS update_security_lots_updated_at ON security_lots;

-- Create trigger for updated_at (idempotent)
CREATE TRIGGER update_security_lots_updated_at
    BEFORE UPDATE ON security_lots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate aggregated portfolio security data from lots (idempotent)
CREATE OR REPLACE FUNCTION calculate_portfolio_security_totals(
    p_portfolio_id UUID,
    p_security_id UUID
)
RETURNS TABLE(
    total_shares INTEGER,
    total_cost DECIMAL(10,2),
    average_cost DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sl.quantity), 0)::INTEGER as total_shares,
        COALESCE(SUM(sl.total_amount), 0)::DECIMAL(10,2) as total_cost,
        CASE 
            WHEN COALESCE(SUM(sl.quantity), 0) > 0 
            THEN COALESCE(SUM(sl.total_amount), 0) / COALESCE(SUM(sl.quantity), 1)
            ELSE 0
        END::DECIMAL(10,2) as average_cost
    FROM security_lots sl
    WHERE sl.portfolio_id = p_portfolio_id 
    AND sl.security_id = p_security_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 