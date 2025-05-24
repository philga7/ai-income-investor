-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create portfolios table
CREATE TABLE portfolios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create securities table
CREATE TABLE securities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    sector TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    yield DECIMAL(5,2) NOT NULL,
    sma200 TEXT NOT NULL CHECK (sma200 IN ('above', 'below')),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create portfolio_securities table (junction table)
CREATE TABLE portfolio_securities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    security_id UUID REFERENCES securities(id) ON DELETE CASCADE,
    shares INTEGER NOT NULL,
    average_cost DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(portfolio_id, security_id)
);

-- Create dividends table
CREATE TABLE dividends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    security_id UUID REFERENCES securities(id) ON DELETE CASCADE,
    amount DECIMAL(10,4) NOT NULL,
    ex_date DATE NOT NULL,
    payment_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolio_securities_portfolio_id ON portfolio_securities(portfolio_id);
CREATE INDEX idx_portfolio_securities_security_id ON portfolio_securities(security_id);
CREATE INDEX idx_dividends_security_id ON dividends(security_id);
CREATE INDEX idx_dividends_ex_date ON dividends(ex_date);
CREATE INDEX idx_securities_ticker ON securities(ticker);
CREATE INDEX idx_securities_sector ON securities(sector);

-- Create RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_securities ENABLE ROW LEVEL SECURITY;
ALTER TABLE dividends ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Portfolios policies
CREATE POLICY "Users can view their own portfolios"
    ON portfolios FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own portfolios"
    ON portfolios FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own portfolios"
    ON portfolios FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own portfolios"
    ON portfolios FOR DELETE
    USING (auth.uid() = user_id);

-- Securities policies (public read, admin write)
CREATE POLICY "Anyone can view securities"
    ON securities FOR SELECT
    USING (true);

-- Portfolio securities policies
CREATE POLICY "Users can view their portfolio securities"
    ON portfolio_securities FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = portfolio_securities.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their portfolio securities"
    ON portfolio_securities FOR ALL
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = portfolio_securities.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

-- Dividends policies (public read, admin write)
CREATE POLICY "Anyone can view dividends"
    ON dividends FOR SELECT
    USING (true);

-- Create functions for updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolios_updated_at
    BEFORE UPDATE ON portfolios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_securities_updated_at
    BEFORE UPDATE ON securities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_securities_updated_at
    BEFORE UPDATE ON portfolio_securities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dividends_updated_at
    BEFORE UPDATE ON dividends
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 