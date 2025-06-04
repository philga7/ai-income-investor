-- Create securities table
CREATE TABLE IF NOT EXISTS public.securities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    yield DECIMAL(5,2) NOT NULL,
    sma200 TEXT NOT NULL CHECK (sma200 IN ('above', 'below')),
    tags TEXT[] DEFAULT '{}',
    dividendGrowth5yr DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_fetched TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.securities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all securities" ON public.securities;
DROP POLICY IF EXISTS "Authenticated users can insert securities" ON public.securities;
DROP POLICY IF EXISTS "Authenticated users can update securities" ON public.securities;

-- Create policies
CREATE POLICY "Users can view all securities"
    ON public.securities FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert securities"
    ON public.securities FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update securities"
    ON public.securities FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_securities_updated_at ON public.securities;
DROP TRIGGER IF EXISTS update_security_last_fetched ON public.securities;

-- Create trigger for updated_at
CREATE TRIGGER update_securities_updated_at
    BEFORE UPDATE ON public.securities
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for last_fetched
CREATE OR REPLACE FUNCTION update_last_fetched()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update last_fetched if price-related fields are being updated
    IF (
        OLD.price IS DISTINCT FROM NEW.price OR
        OLD.yield IS DISTINCT FROM NEW.yield OR
        OLD.sma200 IS DISTINCT FROM NEW.sma200
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_security_last_fetched
    BEFORE UPDATE ON public.securities
    FOR EACH ROW
    EXECUTE FUNCTION update_last_fetched(); 