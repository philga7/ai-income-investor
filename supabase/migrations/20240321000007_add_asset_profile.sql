-- Add asset profile fields to securities table
ALTER TABLE public.securities
ADD COLUMN IF NOT EXISTS address1 TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS industry_key TEXT,
ADD COLUMN IF NOT EXISTS industry_disp TEXT,
ADD COLUMN IF NOT EXISTS sector_key TEXT,
ADD COLUMN IF NOT EXISTS sector_disp TEXT,
ADD COLUMN IF NOT EXISTS long_business_summary TEXT,
ADD COLUMN IF NOT EXISTS full_time_employees INTEGER,
ADD COLUMN IF NOT EXISTS audit_risk INTEGER,
ADD COLUMN IF NOT EXISTS board_risk INTEGER,
ADD COLUMN IF NOT EXISTS compensation_risk INTEGER,
ADD COLUMN IF NOT EXISTS shareholder_rights_risk INTEGER,
ADD COLUMN IF NOT EXISTS overall_risk INTEGER,
ADD COLUMN IF NOT EXISTS governance_epoch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS compensation_as_of_epoch_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ir_website TEXT;

-- Update the last_fetched trigger to include asset profile fields
CREATE OR REPLACE FUNCTION update_last_fetched()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update last_fetched if price-related or asset profile fields are being updated
    IF (
        OLD.price IS DISTINCT FROM NEW.price OR
        OLD.yield IS DISTINCT FROM NEW.yield OR
        OLD.sma200 IS DISTINCT FROM NEW.sma200 OR
        OLD.address1 IS DISTINCT FROM NEW.address1 OR
        OLD.city IS DISTINCT FROM NEW.city OR
        OLD.state IS DISTINCT FROM NEW.state OR
        OLD.zip IS DISTINCT FROM NEW.zip OR
        OLD.country IS DISTINCT FROM NEW.country OR
        OLD.phone IS DISTINCT FROM NEW.phone OR
        OLD.website IS DISTINCT FROM NEW.website OR
        OLD.industry_key IS DISTINCT FROM NEW.industry_key OR
        OLD.industry_disp IS DISTINCT FROM NEW.industry_disp OR
        OLD.sector_key IS DISTINCT FROM NEW.sector_key OR
        OLD.sector_disp IS DISTINCT FROM NEW.sector_disp OR
        OLD.long_business_summary IS DISTINCT FROM NEW.long_business_summary OR
        OLD.full_time_employees IS DISTINCT FROM NEW.full_time_employees OR
        OLD.audit_risk IS DISTINCT FROM NEW.audit_risk OR
        OLD.board_risk IS DISTINCT FROM NEW.board_risk OR
        OLD.compensation_risk IS DISTINCT FROM NEW.compensation_risk OR
        OLD.shareholder_rights_risk IS DISTINCT FROM NEW.shareholder_rights_risk OR
        OLD.overall_risk IS DISTINCT FROM NEW.overall_risk OR
        OLD.governance_epoch_date IS DISTINCT FROM NEW.governance_epoch_date OR
        OLD.compensation_as_of_epoch_date IS DISTINCT FROM NEW.compensation_as_of_epoch_date OR
        OLD.ir_website IS DISTINCT FROM NEW.ir_website
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_security_last_fetched ON public.securities;

-- Create trigger
CREATE TRIGGER update_security_last_fetched
    BEFORE UPDATE ON public.securities
    FOR EACH ROW
    EXECUTE FUNCTION update_last_fetched(); 