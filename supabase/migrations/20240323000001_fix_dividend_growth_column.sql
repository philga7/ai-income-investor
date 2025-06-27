-- Rename dividendGrowth5yr to dividend_growth_5yr to follow PostgreSQL conventions
DO $$ 
BEGIN
    -- First check for camelCase version
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'securities' 
        AND column_name = 'dividendGrowth5yr'
    ) THEN
        ALTER TABLE public.securities 
        RENAME COLUMN "dividendGrowth5yr" TO dividend_growth_5yr;
    -- Then check for lowercase version
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'securities' 
        AND column_name = 'dividendgrowth5yr'
    ) THEN
        ALTER TABLE public.securities 
        RENAME COLUMN "dividendgrowth5yr" TO dividend_growth_5yr;
    END IF;
END $$;

-- Update the trigger function to use the new column name
CREATE OR REPLACE FUNCTION update_last_fetched()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update last_fetched if price-related fields are being updated
    IF (
        OLD.price IS DISTINCT FROM NEW.price OR
        OLD.yield IS DISTINCT FROM NEW.yield OR
        OLD.sma200 IS DISTINCT FROM NEW.sma200 OR
        OLD.prev_close IS DISTINCT FROM NEW.prev_close OR
        OLD.open IS DISTINCT FROM NEW.open OR
        OLD.volume IS DISTINCT FROM NEW.volume OR
        OLD.market_cap IS DISTINCT FROM NEW.market_cap OR
        OLD.pe IS DISTINCT FROM NEW.pe OR
        OLD.eps IS DISTINCT FROM NEW.eps OR
        OLD.dividend IS DISTINCT FROM NEW.dividend OR
        OLD.payout_ratio IS DISTINCT FROM NEW.payout_ratio OR
        OLD.dividend_growth_5yr IS DISTINCT FROM NEW.dividend_growth_5yr
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 