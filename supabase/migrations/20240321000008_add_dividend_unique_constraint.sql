-- Add unique constraint to prevent duplicate dividend entries for the same security and ex-date
-- This migration is idempotent - it will not fail if the constraint already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_security_ex_date'
    ) THEN
        ALTER TABLE dividends 
        ADD CONSTRAINT unique_security_ex_date 
        UNIQUE (security_id, ex_date);
    END IF;
END $$; 