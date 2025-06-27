-- Add summary details columns to securities table if they don't exist
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'day_low') THEN
        ALTER TABLE securities ADD COLUMN day_low DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'day_high') THEN
        ALTER TABLE securities ADD COLUMN day_high DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'fifty_two_week_low') THEN
        ALTER TABLE securities ADD COLUMN fifty_two_week_low DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'fifty_two_week_high') THEN
        ALTER TABLE securities ADD COLUMN fifty_two_week_high DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'average_volume') THEN
        ALTER TABLE securities ADD COLUMN average_volume BIGINT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'forward_pe') THEN
        ALTER TABLE securities ADD COLUMN forward_pe DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'price_to_sales_trailing_12_months') THEN
        ALTER TABLE securities ADD COLUMN price_to_sales_trailing_12_months DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'beta') THEN
        ALTER TABLE securities ADD COLUMN beta DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'fifty_day_average') THEN
        ALTER TABLE securities ADD COLUMN fifty_day_average DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'two_hundred_day_average') THEN
        ALTER TABLE securities ADD COLUMN two_hundred_day_average DECIMAL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'ex_dividend_date') THEN
        ALTER TABLE securities ADD COLUMN ex_dividend_date TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_securities_fifty_two_week_low') THEN
        CREATE INDEX idx_securities_fifty_two_week_low ON securities(fifty_two_week_low);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_securities_fifty_two_week_high') THEN
        CREATE INDEX idx_securities_fifty_two_week_high ON securities(fifty_two_week_high);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_securities_beta') THEN
        CREATE INDEX idx_securities_beta ON securities(beta);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_securities_ex_dividend_date') THEN
        CREATE INDEX idx_securities_ex_dividend_date ON securities(ex_dividend_date);
    END IF;
END $$; 