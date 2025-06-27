-- Add missing columns to securities table
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS prev_close DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS open DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS volume BIGINT,
ADD COLUMN IF NOT EXISTS market_cap BIGINT,
ADD COLUMN IF NOT EXISTS pe DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS eps DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS dividend DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS payout_ratio DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS dividendGrowth5yr DECIMAL(5,2);

-- Create or replace the function
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
        OLD.dividendGrowth5yr IS DISTINCT FROM NEW.dividendGrowth5yr
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_security_last_fetched ON public.securities;

-- Create the trigger
CREATE TRIGGER update_security_last_fetched
    BEFORE UPDATE ON public.securities
    FOR EACH ROW
    EXECUTE FUNCTION update_last_fetched(); 