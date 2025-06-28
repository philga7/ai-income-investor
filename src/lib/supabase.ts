import { createClient } from '@supabase/supabase-js';

// Create a single instance of the Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Types for our database tables
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
};

export type Portfolio = {
  id: string;
  user_id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type Security = {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  price: number;
  prev_close: number;
  open: number;
  volume: number;
  market_cap: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
  dividend_growth_5yr: number;
  payout_ratio: number;
  sma200: 'above' | 'below';
  tags: string[];
  day_low: number;
  day_high: number;
  fifty_two_week_low: number;
  fifty_two_week_high: number;
  average_volume: number;
  forward_pe: number;
  price_to_sales_trailing_12_months: number;
  beta: number;
  fifty_day_average: number;
  two_hundred_day_average: number;
  ex_dividend_date: string;
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_growth: number;
  created_at: string;
  updated_at: string;
  last_fetched: string;
};

export type PortfolioSecurity = {
  id: string;
  portfolio_id: string;
  security_id: string;
  shares: number;
  average_cost: number;
  created_at: string;
  updated_at: string;
};

export type Dividend = {
  id: string;
  security_id: string;
  amount: number;
  ex_date: string;
  payment_date: string;
  created_at: string;
  updated_at: string;
}; 