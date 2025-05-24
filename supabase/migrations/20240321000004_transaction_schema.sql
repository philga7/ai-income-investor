-- Create transactions table
CREATE TABLE transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    portfolio_id UUID REFERENCES portfolios(id) ON DELETE CASCADE,
    security_id UUID REFERENCES securities(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('buy', 'sell')),
    shares INTEGER NOT NULL,
    price_per_share DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create transaction-related indexes
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_security_id ON transactions(security_id);
CREATE INDEX idx_transactions_transaction_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_portfolio_security ON transactions(portfolio_id, security_id);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their portfolio transactions"
    ON transactions FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = transactions.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their portfolio transactions"
    ON transactions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM portfolios
        WHERE portfolios.id = transactions.portfolio_id
        AND portfolios.user_id = auth.uid()
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 