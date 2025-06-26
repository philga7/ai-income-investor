-- Migration to support fractional shares in security_lots table
-- This allows for DRIP (Dividend Reinvestment Plan) and other fractional share purchases

-- First, update the quantity column to support decimal values (only if it's not already DECIMAL)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'security_lots' 
        AND column_name = 'quantity' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.security_lots 
        ALTER COLUMN quantity TYPE DECIMAL(10,4) USING quantity::DECIMAL(10,4);
    END IF;
END $$;

-- Update the check constraint to allow fractional shares (greater than 0, not just integers)
ALTER TABLE public.security_lots 
DROP CONSTRAINT IF EXISTS security_lots_quantity_check;

ALTER TABLE public.security_lots 
ADD CONSTRAINT security_lots_quantity_check CHECK (quantity > 0);

-- Drop the existing function first (idempotent)
DROP FUNCTION IF EXISTS calculate_portfolio_security_totals(uuid, uuid);

-- Update the calculate_portfolio_security_totals function to handle decimal quantities
CREATE OR REPLACE FUNCTION calculate_portfolio_security_totals(
    p_portfolio_id UUID,
    p_security_id UUID
)
RETURNS TABLE(
    total_shares DECIMAL(10,4),
    total_cost DECIMAL(10,2),
    average_cost DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(sl.quantity), 0)::DECIMAL(10,4) as total_shares,
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