import { supabase } from '@/lib/supabase';

export interface Security {
  id: string;
  ticker: string;
  name: string;
  sector: string;
  price: number;
  yield: number;
  sma200: 'above' | 'below';
  tags: string[];
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
  }
}; 