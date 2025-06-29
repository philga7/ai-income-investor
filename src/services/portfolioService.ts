import { supabase } from '@/lib/supabase';

export type Security = {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  industry_key?: string;
  industry_disp?: string;
  sector_key?: string;
  sector_disp?: string;
  long_business_summary?: string;
  full_time_employees?: number;
  audit_risk?: number;
  board_risk?: number;
  compensation_risk?: number;
  shareholder_rights_risk?: number;
  overall_risk?: number;
  governance_epoch_date?: string;
  compensation_as_of_epoch_date?: string;
  ir_website?: string;
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
  ex_dividend_date?: string;
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_growth: number;
  target_low_price?: number;
  target_high_price?: number;
  recommendation_key?: string;
  number_of_analyst_opinions?: number;
  total_cash?: number;
  total_debt?: number;
  current_ratio?: number;
  quick_ratio?: number;
  debt_to_equity?: number;
  revenue_per_share?: number;
  return_on_assets?: number;
  return_on_equity?: number;
  gross_profits?: number;
  earnings_growth?: number;
  revenue_growth?: number;
  gross_margins?: number;
  ebitda_margins?: number;
  operating_margins?: number;
  profit_margins?: number;
  // Balance sheet fields
  total_assets?: number;
  total_current_assets?: number;
  total_liabilities?: number;
  total_current_liabilities?: number;
  total_stockholder_equity?: number;
  cash?: number;
  short_term_investments?: number;
  net_receivables?: number;
  inventory?: number;
  other_current_assets?: number;
  long_term_investments?: number;
  property_plant_equipment?: number;
  other_assets?: number;
  intangible_assets?: number;
  goodwill?: number;
  accounts_payable?: number;
  short_long_term_debt?: number;
  other_current_liabilities?: number;
  long_term_debt?: number;
  other_liabilities?: number;
  minority_interest?: number;
  treasury_stock?: number;
  retained_earnings?: number;
  common_stock?: number;
  capital_surplus?: number;
  last_fetched?: string;
  // Earnings data
  earnings?: {
    maxAge: number;
    earningsDate: number[];
    earningsAverage: number;
    earningsLow: number;
    earningsHigh: number;
    earningsChart: {
      quarterly: {
        date: number;
        actual: number;
        estimate: number;
      }[];
      currentQuarterEstimate: number;
      currentQuarterEstimateDate: string;
      currentQuarterEstimateYear: number;
      earningsDate: number[];
      isEarningsDateEstimate: boolean;
    };
    financialsChart: {
      yearly: {
        date: number;
        revenue: number;
        earnings: number;
      }[];
      quarterly: {
        date: number;
        revenue: number;
        earnings: number;
      }[];
    };
    financialCurrency: string;
  };
};

export interface PortfolioSecurity {
  id: string;
  shares: number;
  average_cost: number;
  security: Security;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  securities: PortfolioSecurity[];
}

export const portfolioService = {
  async getPortfolio(id: string): Promise<Portfolio | null> {
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_securities (
          id,
          shares,
          average_cost,
          security:securities (
            id,
            ticker,
            name,
            sector,
            price,
            yield,
            sma200,
            tags
          )
        )
      `)
      .eq('id', id)
      .single();

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return null;
    }

    // Transform the data to match our interface
    const transformedPortfolio = {
      ...portfolio,
      securities: portfolio.portfolio_securities.map((ps: any) => ({
        id: ps.id,
        shares: Number(ps.shares),
        average_cost: Number(ps.average_cost),
        security: {
          ...ps.security,
          price: Number(ps.security.price),
          yield: Number(ps.security.yield)
        }
      }))
    };

    return transformedPortfolio;
  },

  async getPortfolios(): Promise<Portfolio[]> {
    const { data: portfolios, error } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_securities (
          id,
          shares,
          average_cost,
          security:securities (
            id,
            ticker,
            name,
            sector,
            price,
            yield,
            sma200,
            tags
          )
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching portfolios:', error);
      return [];
    }

    return portfolios.map((portfolio: any) => ({
      ...portfolio,
      securities: portfolio.portfolio_securities.map((ps: any) => ({
        id: ps.id,
        shares: Number(ps.shares),
        average_cost: Number(ps.average_cost),
        security: {
          ...ps.security,
          price: Number(ps.security.price),
          yield: Number(ps.security.yield)
        }
      }))
    }));
  },

  async searchPortfolios(query: string, filters?: {
    sortBy?: 'name' | 'created_at';
    sortOrder?: 'asc' | 'desc';
  }): Promise<Portfolio[]> {
    let queryBuilder = supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_securities (
          id,
          shares,
          average_cost,
          security:securities (
            id,
            ticker,
            name,
            sector,
            price,
            yield,
            sma200,
            tags
          )
        )
      `);

    // Apply search query if provided
    if (query) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`);
    }

    // Apply sorting
    if (filters?.sortBy) {
      queryBuilder = queryBuilder.order(filters.sortBy, { 
        ascending: filters.sortOrder === 'asc' 
      });
    } else {
      // Default sorting by created_at desc
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
    }

    const { data: portfolios, error } = await queryBuilder;

    if (error) {
      console.error('Error searching portfolios:', error);
      return [];
    }

    return portfolios.map((portfolio: any) => ({
      ...portfolio,
      securities: portfolio.portfolio_securities.map((ps: any) => ({
        id: ps.id,
        shares: Number(ps.shares),
        average_cost: Number(ps.average_cost),
        security: {
          ...ps.security,
          price: Number(ps.security.price),
          yield: Number(ps.security.yield)
        }
      }))
    }));
  }
}; 