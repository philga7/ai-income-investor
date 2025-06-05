import { supabase } from '@/lib/supabase';

export interface Security {
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
  ex_dividend_date: string;
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_growth: number;
  last_fetched: string;
}

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