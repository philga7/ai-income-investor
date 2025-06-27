-- Create AI analysis cache table
CREATE TABLE IF NOT EXISTS public.ai_analysis_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_type TEXT NOT NULL DEFAULT 'portfolio_analysis',
    model_used TEXT NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    estimated_cost DECIMAL(10, 6) NOT NULL,
    analysis_content TEXT NOT NULL,
    portfolio_snapshot JSONB NOT NULL, -- Store portfolio state at time of analysis
    portfolio_hash TEXT NOT NULL, -- Hash of portfolio data for change detection
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc'::text, NOW()) + INTERVAL '7 days') NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

-- Create indexes for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_portfolio_id ON ai_analysis_cache(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_user_id ON ai_analysis_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_portfolio_hash ON ai_analysis_cache(portfolio_hash);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_expires_at ON ai_analysis_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_active ON ai_analysis_cache(is_active) WHERE is_active = true;

-- Create composite index for common queries (idempotent)
CREATE INDEX IF NOT EXISTS idx_ai_analysis_cache_portfolio_user_type ON ai_analysis_cache(portfolio_id, user_id, analysis_type);

-- Enable RLS
ALTER TABLE public.ai_analysis_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (idempotent)
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own AI analysis cache" ON public.ai_analysis_cache;
    DROP POLICY IF EXISTS "Users can insert their own AI analysis cache" ON public.ai_analysis_cache;
    DROP POLICY IF EXISTS "Users can update their own AI analysis cache" ON public.ai_analysis_cache;
    DROP POLICY IF EXISTS "Users can delete their own AI analysis cache" ON public.ai_analysis_cache;
    
    -- Create new policies
    CREATE POLICY "Users can view their own AI analysis cache"
        ON public.ai_analysis_cache FOR SELECT
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own AI analysis cache"
        ON public.ai_analysis_cache FOR INSERT
        WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own AI analysis cache"
        ON public.ai_analysis_cache FOR UPDATE
        USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own AI analysis cache"
        ON public.ai_analysis_cache FOR DELETE
        USING (auth.uid() = user_id);
END $$;

-- Create function to generate portfolio hash (idempotent)
CREATE OR REPLACE FUNCTION generate_portfolio_hash(portfolio_data JSONB)
RETURNS TEXT AS $$
BEGIN
    -- Create a hash based on portfolio structure and securities
    RETURN encode(sha256(portfolio_data::text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired cache entries (idempotent)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM ai_analysis_cache 
    WHERE expires_at < TIMEZONE('utc'::text, NOW()) 
    OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at column (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ai_analysis_cache' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.ai_analysis_cache 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL;
    END IF;
END $$;

-- Create trigger to update updated_at timestamp (idempotent)
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS update_ai_analysis_cache_updated_at ON public.ai_analysis_cache;
    
    -- Create new trigger
    CREATE TRIGGER update_ai_analysis_cache_updated_at
        BEFORE UPDATE ON public.ai_analysis_cache
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Create function to get latest valid analysis (idempotent)
CREATE OR REPLACE FUNCTION get_latest_ai_analysis(
    p_portfolio_id UUID,
    p_user_id UUID,
    p_analysis_type TEXT DEFAULT 'portfolio_analysis'
)
RETURNS TABLE (
    id UUID,
    analysis_content TEXT,
    model_used TEXT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    estimated_cost DECIMAL(10, 6),
    portfolio_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_cached BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cache.id,
        cache.analysis_content,
        cache.model_used,
        cache.input_tokens,
        cache.output_tokens,
        cache.total_tokens,
        cache.estimated_cost,
        cache.portfolio_hash,
        cache.created_at,
        cache.expires_at,
        true as is_cached
    FROM ai_analysis_cache cache
    WHERE cache.portfolio_id = p_portfolio_id
      AND cache.user_id = p_user_id
      AND cache.analysis_type = p_analysis_type
      AND cache.is_active = true
      AND cache.expires_at > TIMEZONE('utc'::text, NOW())
    ORDER BY cache.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 