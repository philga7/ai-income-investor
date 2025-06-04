-- Drop existing trigger and function if they exist
DROP TRIGGER IF EXISTS update_security_last_fetched ON public.securities;
DROP FUNCTION IF EXISTS update_last_fetched();

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
        OLD.dividend_growth_5yr IS DISTINCT FROM NEW.dividend_growth_5yr OR
        OLD.target_low_price IS DISTINCT FROM NEW.target_low_price OR
        OLD.target_high_price IS DISTINCT FROM NEW.target_high_price OR
        OLD.recommendation_key IS DISTINCT FROM NEW.recommendation_key OR
        OLD.number_of_analyst_opinions IS DISTINCT FROM NEW.number_of_analyst_opinions OR
        OLD.total_cash IS DISTINCT FROM NEW.total_cash OR
        OLD.total_debt IS DISTINCT FROM NEW.total_debt OR
        OLD.current_ratio IS DISTINCT FROM NEW.current_ratio OR
        OLD.quick_ratio IS DISTINCT FROM NEW.quick_ratio OR
        OLD.debt_to_equity IS DISTINCT FROM NEW.debt_to_equity OR
        OLD.return_on_equity IS DISTINCT FROM NEW.return_on_equity OR
        OLD.profit_margins IS DISTINCT FROM NEW.profit_margins OR
        OLD.operating_margins IS DISTINCT FROM NEW.operating_margins OR
        OLD.revenue_growth IS DISTINCT FROM NEW.revenue_growth OR
        OLD.earnings_growth IS DISTINCT FROM NEW.earnings_growth
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add financial data columns to securities table if they don't exist
DO $$ 
BEGIN
    -- Target prices
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'target_low_price') THEN
        ALTER TABLE public.securities ADD COLUMN target_low_price DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'target_high_price') THEN
        ALTER TABLE public.securities ADD COLUMN target_high_price DECIMAL(10,2);
    END IF;

    -- Analyst recommendations
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'recommendation_key') THEN
        ALTER TABLE public.securities ADD COLUMN recommendation_key TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'number_of_analyst_opinions') THEN
        ALTER TABLE public.securities ADD COLUMN number_of_analyst_opinions INTEGER;
    END IF;

    -- Cash and debt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_cash') THEN
        ALTER TABLE public.securities ADD COLUMN total_cash BIGINT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_debt') THEN
        ALTER TABLE public.securities ADD COLUMN total_debt BIGINT;
    END IF;

    -- Financial ratios
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'current_ratio') THEN
        ALTER TABLE public.securities ADD COLUMN current_ratio DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'quick_ratio') THEN
        ALTER TABLE public.securities ADD COLUMN quick_ratio DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'debt_to_equity') THEN
        ALTER TABLE public.securities ADD COLUMN debt_to_equity DECIMAL(10,2);
    END IF;

    -- Performance metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'return_on_equity') THEN
        ALTER TABLE public.securities ADD COLUMN return_on_equity DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'profit_margins') THEN
        ALTER TABLE public.securities ADD COLUMN profit_margins DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'operating_margins') THEN
        ALTER TABLE public.securities ADD COLUMN operating_margins DECIMAL(10,2);
    END IF;

    -- Growth metrics
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'revenue_growth') THEN
        ALTER TABLE public.securities ADD COLUMN revenue_growth DECIMAL(10,2);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'earnings_growth') THEN
        ALTER TABLE public.securities ADD COLUMN earnings_growth DECIMAL(10,2);
    END IF;

    -- Fix dividend growth column name if it exists in camelCase
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'securities' 
        AND column_name = 'dividendGrowth5yr'
    ) THEN
        ALTER TABLE public.securities 
        RENAME COLUMN "dividendGrowth5yr" TO dividend_growth_5yr;
    END IF;
END $$;

-- Create the trigger
CREATE TRIGGER update_security_last_fetched
    BEFORE UPDATE ON public.securities
    FOR EACH ROW
    EXECUTE FUNCTION update_last_fetched(); 