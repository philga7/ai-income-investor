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
  price: number;
  yield: number;
  sma200: 'above' | 'below';
  tags: string[];
  dividendGrowth5yr: number;
  created_at: string;
  updated_at: string;
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