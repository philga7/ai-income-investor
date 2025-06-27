-- Fix ex_dividend_date column type to prevent timezone errors
-- This migration converts the column from TIMESTAMP WITH TIME ZONE to DATE

DO $$ 
BEGIN
    -- Check if the column exists and is TIMESTAMP WITH TIME ZONE
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'securities' 
        AND column_name = 'ex_dividend_date' 
        AND data_type = 'timestamp with time zone'
    ) THEN
        -- Convert the column to DATE type
        ALTER TABLE securities ALTER COLUMN ex_dividend_date TYPE DATE USING ex_dividend_date::DATE;
        
        RAISE NOTICE 'Successfully converted ex_dividend_date column from TIMESTAMP WITH TIME ZONE to DATE';
    ELSE
        RAISE NOTICE 'ex_dividend_date column is already DATE type or does not exist';
    END IF;
END $$; 