-- Add balance sheet statement columns to securities table
DO $$ 
BEGIN
    -- Total Assets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_assets') THEN
        ALTER TABLE public.securities ADD COLUMN total_assets BIGINT;
    END IF;

    -- Total Current Assets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_current_assets') THEN
        ALTER TABLE public.securities ADD COLUMN total_current_assets BIGINT;
    END IF;

    -- Total Liabilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_liabilities') THEN
        ALTER TABLE public.securities ADD COLUMN total_liabilities BIGINT;
    END IF;

    -- Total Current Liabilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_current_liabilities') THEN
        ALTER TABLE public.securities ADD COLUMN total_current_liabilities BIGINT;
    END IF;

    -- Total Stockholder Equity
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'total_stockholder_equity') THEN
        ALTER TABLE public.securities ADD COLUMN total_stockholder_equity BIGINT;
    END IF;

    -- Cash
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'cash') THEN
        ALTER TABLE public.securities ADD COLUMN cash BIGINT;
    END IF;

    -- Short Term Investments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'short_term_investments') THEN
        ALTER TABLE public.securities ADD COLUMN short_term_investments BIGINT;
    END IF;

    -- Net Receivables
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'net_receivables') THEN
        ALTER TABLE public.securities ADD COLUMN net_receivables BIGINT;
    END IF;

    -- Inventory
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'inventory') THEN
        ALTER TABLE public.securities ADD COLUMN inventory BIGINT;
    END IF;

    -- Other Current Assets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'other_current_assets') THEN
        ALTER TABLE public.securities ADD COLUMN other_current_assets BIGINT;
    END IF;

    -- Long Term Investments
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'long_term_investments') THEN
        ALTER TABLE public.securities ADD COLUMN long_term_investments BIGINT;
    END IF;

    -- Property Plant Equipment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'property_plant_equipment') THEN
        ALTER TABLE public.securities ADD COLUMN property_plant_equipment BIGINT;
    END IF;

    -- Other Assets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'other_assets') THEN
        ALTER TABLE public.securities ADD COLUMN other_assets BIGINT;
    END IF;

    -- Intangible Assets
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'intangible_assets') THEN
        ALTER TABLE public.securities ADD COLUMN intangible_assets BIGINT;
    END IF;

    -- Goodwill
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'goodwill') THEN
        ALTER TABLE public.securities ADD COLUMN goodwill BIGINT;
    END IF;

    -- Accounts Payable
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'accounts_payable') THEN
        ALTER TABLE public.securities ADD COLUMN accounts_payable BIGINT;
    END IF;

    -- Short Long Term Debt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'short_long_term_debt') THEN
        ALTER TABLE public.securities ADD COLUMN short_long_term_debt BIGINT;
    END IF;

    -- Other Current Liabilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'other_current_liabilities') THEN
        ALTER TABLE public.securities ADD COLUMN other_current_liabilities BIGINT;
    END IF;

    -- Long Term Debt
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'long_term_debt') THEN
        ALTER TABLE public.securities ADD COLUMN long_term_debt BIGINT;
    END IF;

    -- Other Liabilities
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'other_liabilities') THEN
        ALTER TABLE public.securities ADD COLUMN other_liabilities BIGINT;
    END IF;

    -- Minority Interest
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'minority_interest') THEN
        ALTER TABLE public.securities ADD COLUMN minority_interest BIGINT;
    END IF;

    -- Treasury Stock
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'treasury_stock') THEN
        ALTER TABLE public.securities ADD COLUMN treasury_stock BIGINT;
    END IF;

    -- Retained Earnings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'retained_earnings') THEN
        ALTER TABLE public.securities ADD COLUMN retained_earnings BIGINT;
    END IF;

    -- Common Stock
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'common_stock') THEN
        ALTER TABLE public.securities ADD COLUMN common_stock BIGINT;
    END IF;

    -- Capital Surplus
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'securities' AND column_name = 'capital_surplus') THEN
        ALTER TABLE public.securities ADD COLUMN capital_surplus BIGINT;
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
        OLD.cash_flow_growth IS DISTINCT FROM NEW.cash_flow_growth OR
        OLD.total_assets IS DISTINCT FROM NEW.total_assets OR
        OLD.total_current_assets IS DISTINCT FROM NEW.total_current_assets OR
        OLD.total_liabilities IS DISTINCT FROM NEW.total_liabilities OR
        OLD.total_current_liabilities IS DISTINCT FROM NEW.total_current_liabilities OR
        OLD.total_stockholder_equity IS DISTINCT FROM NEW.total_stockholder_equity OR
        OLD.cash IS DISTINCT FROM NEW.cash OR
        OLD.short_term_investments IS DISTINCT FROM NEW.short_term_investments OR
        OLD.net_receivables IS DISTINCT FROM NEW.net_receivables OR
        OLD.inventory IS DISTINCT FROM NEW.inventory OR
        OLD.other_current_assets IS DISTINCT FROM NEW.other_current_assets OR
        OLD.long_term_investments IS DISTINCT FROM NEW.long_term_investments OR
        OLD.property_plant_equipment IS DISTINCT FROM NEW.property_plant_equipment OR
        OLD.other_assets IS DISTINCT FROM NEW.other_assets OR
        OLD.intangible_assets IS DISTINCT FROM NEW.intangible_assets OR
        OLD.goodwill IS DISTINCT FROM NEW.goodwill OR
        OLD.accounts_payable IS DISTINCT FROM NEW.accounts_payable OR
        OLD.short_long_term_debt IS DISTINCT FROM NEW.short_long_term_debt OR
        OLD.other_current_liabilities IS DISTINCT FROM NEW.other_current_liabilities OR
        OLD.long_term_debt IS DISTINCT FROM NEW.long_term_debt OR
        OLD.other_liabilities IS DISTINCT FROM NEW.other_liabilities OR
        OLD.minority_interest IS DISTINCT FROM NEW.minority_interest OR
        OLD.treasury_stock IS DISTINCT FROM NEW.treasury_stock OR
        OLD.retained_earnings IS DISTINCT FROM NEW.retained_earnings OR
        OLD.common_stock IS DISTINCT FROM NEW.common_stock OR
        OLD.capital_surplus IS DISTINCT FROM NEW.capital_surplus
    ) THEN
        NEW.last_fetched = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 