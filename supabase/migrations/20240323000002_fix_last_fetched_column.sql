-- Ensure last_fetched column exists with correct name
DO $$ 
BEGIN
    -- Check if column exists with different case
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'securities' 
        AND column_name = 'lastFetched'
    ) THEN
        ALTER TABLE public.securities 
        RENAME COLUMN "lastFetched" TO last_fetched;
    -- If column doesn't exist at all, create it
    ELSIF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'securities' 
        AND column_name = 'last_fetched'
    ) THEN
        ALTER TABLE public.securities 
        ADD COLUMN last_fetched TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
    END IF;
END $$;

-- Update the trigger function to use the correct column name
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