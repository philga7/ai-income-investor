import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { portfolioRebalancingService } from '@/src/services/portfolioRebalancingService';
import { portfolioDataService } from '@/src/services/portfolioDataService';
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

    // Get basic portfolio info
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
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

    // Use the centralized TTL-based mechanism to fetch securities with automatic fundamentals refresh
    const portfolioSecurities = await portfolioDataService.updatePortfolioSecurities(id, supabase, token);

    // Transform the portfolio data to match the expected interface
    const transformedPortfolio: Portfolio = {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      created_at: portfolio.created_at,
      updated_at: portfolio.updated_at,
      securities: portfolioSecurities.map((ps) => ({
        id: ps.id,
        shares: ps.shares,
        average_cost: ps.average_cost,
        security: ps.security
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