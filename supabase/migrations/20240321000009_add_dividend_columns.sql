-- Add missing columns to securities table
-- This migration is idempotent - it will not fail if columns already exist

DO $$ 
BEGIN
    -- Add dividend-related columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'dividend_growth_5yr') THEN
        ALTER TABLE securities ADD COLUMN dividend_growth_5yr DECIMAL(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'payout_ratio') THEN
        ALTER TABLE securities ADD COLUMN payout_ratio DECIMAL(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'five_year_avg_yield') THEN
        ALTER TABLE securities ADD COLUMN five_year_avg_yield DECIMAL(5,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'ex_dividend_date') THEN
        ALTER TABLE securities ADD COLUMN ex_dividend_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'dividend') THEN
        ALTER TABLE securities ADD COLUMN dividend DECIMAL(10,4);
    END IF;

    -- Add missing basic columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'prev_close') THEN
        ALTER TABLE securities ADD COLUMN prev_close DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'open') THEN
        ALTER TABLE securities ADD COLUMN open DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'volume') THEN
        ALTER TABLE securities ADD COLUMN volume BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'market_cap') THEN
        ALTER TABLE securities ADD COLUMN market_cap BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'pe') THEN
        ALTER TABLE securities ADD COLUMN pe DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'eps') THEN
        ALTER TABLE securities ADD COLUMN eps DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'industry') THEN
        ALTER TABLE securities ADD COLUMN industry TEXT;
    END IF;

    -- Add technical analysis columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'day_low') THEN
        ALTER TABLE securities ADD COLUMN day_low DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'day_high') THEN
        ALTER TABLE securities ADD COLUMN day_high DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'fifty_two_week_low') THEN
        ALTER TABLE securities ADD COLUMN fifty_two_week_low DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'fifty_two_week_high') THEN
        ALTER TABLE securities ADD COLUMN fifty_two_week_high DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'average_volume') THEN
        ALTER TABLE securities ADD COLUMN average_volume BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'forward_pe') THEN
        ALTER TABLE securities ADD COLUMN forward_pe DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'price_to_sales_trailing_12_months') THEN
        ALTER TABLE securities ADD COLUMN price_to_sales_trailing_12_months DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'beta') THEN
        ALTER TABLE securities ADD COLUMN beta DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'fifty_day_average') THEN
        ALTER TABLE securities ADD COLUMN fifty_day_average DECIMAL(10,2);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'two_hundred_day_average') THEN
        ALTER TABLE securities ADD COLUMN two_hundred_day_average DECIMAL(10,2);
    END IF;

    -- Add financial data columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'operating_cash_flow') THEN
        ALTER TABLE securities ADD COLUMN operating_cash_flow BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'free_cash_flow') THEN
        ALTER TABLE securities ADD COLUMN free_cash_flow BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'cash_flow_growth') THEN
        ALTER TABLE securities ADD COLUMN cash_flow_growth BIGINT;
    END IF;

    -- Add earnings data column (JSONB for complex earnings data)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'earnings') THEN
        ALTER TABLE securities ADD COLUMN earnings JSONB;
    END IF;

END $$; 