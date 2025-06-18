import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { portfolioRebalancingService } from '@/src/services/portfolioRebalancingService';
import type { Portfolio, PortfolioSecurity } from '@/src/services/portfolioService';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const riskProfile = searchParams.get('riskProfile') as 'conservative' | 'moderate' | 'aggressive' || 'moderate';

    // Get the authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Create Supabase client with the token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    );
    
    // Verify the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Error verifying token:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get the portfolio with securities using the authenticated client
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
            industry,
            price,
            market_cap,
            yield,
            sma200,
            tags
          )
        )
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (portfolioError || !portfolio) {
      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    // Transform the portfolio data to match the expected interface
    const transformedPortfolio: Portfolio = {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      created_at: portfolio.created_at,
      updated_at: portfolio.updated_at,
      securities: portfolio.portfolio_securities.map((ps: any) => ({
        id: ps.id,
        shares: Number(ps.shares),
        average_cost: Number(ps.average_cost),
        security: {
          id: ps.security.id,
          ticker: ps.security.ticker,
          name: ps.security.name,
          sector: ps.security.sector,
          industry: ps.security.industry,
          price: Number(ps.security.price),
          market_cap: Number(ps.security.market_cap || 0),
          yield: Number(ps.security.yield || 0),
          sma200: ps.security.sma200,
          tags: ps.security.tags || [],
          // Add other required fields with defaults
          prev_close: 0,
          open: 0,
          volume: 0,
          pe: 0,
          eps: 0,
          dividend: 0,
          dividend_growth_5yr: 0,
          payout_ratio: 0,
          day_low: 0,
          day_high: 0,
          fifty_two_week_low: 0,
          fifty_two_week_high: 0,
          average_volume: 0,
          forward_pe: 0,
          price_to_sales_trailing_12_months: 0,
          beta: 0,
          fifty_day_average: 0,
          two_hundred_day_average: 0,
          ex_dividend_date: '',
          operating_cash_flow: 0,
          free_cash_flow: 0,
          cash_flow_growth: 0
        }
      }))
    };

    // Analyze portfolio rebalancing
    const rebalancingAnalysis = await portfolioRebalancingService.analyzePortfolioRebalancing(
      transformedPortfolio,
      riskProfile
    );

    return NextResponse.json(rebalancingAnalysis);
  } catch (error) {
    console.error('Error analyzing portfolio rebalancing:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 