-- Add earnings data columns to securities table
DO $$ 
BEGIN
    -- Add earnings data as JSONB column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'earnings') THEN
        ALTER TABLE public.securities ADD COLUMN earnings JSONB;
    END IF;

    -- Add financial metrics columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'gross_margins') THEN
        ALTER TABLE public.securities ADD COLUMN gross_margins DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'ebitda_margins') THEN
        ALTER TABLE public.securities ADD COLUMN ebitda_margins DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'operating_margins') THEN
        ALTER TABLE public.securities ADD COLUMN operating_margins DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'profit_margins') THEN
        ALTER TABLE public.securities ADD COLUMN profit_margins DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'gross_profits') THEN
        ALTER TABLE public.securities ADD COLUMN gross_profits BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'revenue_per_share') THEN
        ALTER TABLE public.securities ADD COLUMN revenue_per_share DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'return_on_assets') THEN
        ALTER TABLE public.securities ADD COLUMN return_on_assets DECIMAL(10,2);
    END IF;
END $$;

-- Update the trigger function to include earnings data and financial metrics
DO $$ 
BEGIN
    -- Check if function exists
    IF EXISTS (
        SELECT 1 
        FROM pg_proc 
        WHERE proname = 'update_last_fetched' 
        AND pronamespace = 'public'::regnamespace
    ) THEN
        -- Drop existing trigger if it exists
        DROP TRIGGER IF EXISTS update_security_last_fetched ON public.securities;
        
        -- Create or replace the function
        EXECUTE $func$
        CREATE OR REPLACE FUNCTION update_last_fetched()
        RETURNS TRIGGER AS $body$
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
                OLD.operating_cash_flow IS DISTINCT FROM NEW.operating_cash_flow OR
                OLD.free_cash_flow IS DISTINCT FROM NEW.free_cash_flow OR
                OLD.cash_flow_growth IS DISTINCT FROM NEW.cash_flow_growth OR
                OLD.earnings IS DISTINCT FROM NEW.earnings OR
                OLD.gross_margins IS DISTINCT FROM NEW.gross_margins OR
                OLD.ebitda_margins IS DISTINCT FROM NEW.ebitda_margins OR
                OLD.operating_margins IS DISTINCT FROM NEW.operating_margins OR
                OLD.profit_margins IS DISTINCT FROM NEW.profit_margins OR
                OLD.gross_profits IS DISTINCT FROM NEW.gross_profits OR
                OLD.revenue_per_share IS DISTINCT FROM NEW.revenue_per_share OR
                OLD.return_on_assets IS DISTINCT FROM NEW.return_on_assets
            ) THEN
                NEW.last_fetched = timezone('utc'::text, now());
            END IF;
            RETURN NEW;
        END;
        $body$ LANGUAGE plpgsql;
        $func$;
        
        -- Create trigger
        CREATE TRIGGER update_security_last_fetched
            BEFORE UPDATE ON public.securities
            FOR EACH ROW
            EXECUTE FUNCTION update_last_fetched();
    END IF;
END $$; 