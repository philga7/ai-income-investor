-- Migration to support fractional shares in portfolio_securities table
-- This allows for fractional share quantities in portfolio summaries

-- First, check if portfolio_securities table exists and update shares column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'portfolio_securities' 
        AND column_name = 'shares' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.portfolio_securities 
        ALTER COLUMN shares TYPE DECIMAL(10,4) USING shares::DECIMAL(10,4);
    END IF;
END $$;

-- Also update the transactions table to support fractional shares
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'shares' 
        AND data_type = 'integer'
    ) THEN
        ALTER TABLE public.transactions 
        ALTER COLUMN shares TYPE DECIMAL(10,4) USING shares::DECIMAL(10,4);
    END IF;
END $$; 