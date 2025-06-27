-- Add cash flow statement columns to securities table
DO $$ 
BEGIN
    -- Operating Cash Flow
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'operating_cash_flow') THEN
        ALTER TABLE public.securities ADD COLUMN operating_cash_flow BIGINT;
    END IF;

    -- Free Cash Flow
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'free_cash_flow') THEN
        ALTER TABLE public.securities ADD COLUMN free_cash_flow BIGINT;
    END IF;

    -- Cash Flow Growth
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'cash_flow_growth') THEN
        ALTER TABLE public.securities ADD COLUMN cash_flow_growth DECIMAL(10,2);
    END IF;
END $$;

-- Update the trigger function to include new fields
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
        OLD.operating_cash_flow IS DISTINCT FROM NEW.operating_cash_flow OR
        OLD.free_cash_flow IS DISTINCT FROM NEW.free_cash_flow OR
        OLD.cash_flow_growth IS DISTINCT FROM NEW.cash_flow_growth
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 