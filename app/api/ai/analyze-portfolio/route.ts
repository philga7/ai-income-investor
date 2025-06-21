import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnthropicClient } from '@/lib/ai/anthropic-client';
import { aiAnalysisCacheService } from '@/src/services/aiAnalysisCacheService';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Create Supabase client with token
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
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { portfolioId, forceRefresh = false } = await request.json();
    
    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    console.log(`AI Analysis requested for portfolio ${portfolioId} by user ${user.id}`);

    // Debug: Check if portfolio exists first
    const { data: portfolioExists, error: existsError } = await supabase
      .from('portfolios')
      .select('id, name, user_id')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    console.log('Portfolio exists check:', { portfolioExists, existsError });

    if (existsError || !portfolioExists) {
      console.error('Portfolio not found:', { portfolioId, userId: user.id, error: existsError });
      return NextResponse.json({ 
        error: 'Portfolio not found',
        details: { portfolioId, userId: user.id, error: existsError?.message }
      }, { status: 404 });
    }

    // Fetch portfolio data with securities
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select(`
        *,
        portfolio_securities(
          *,
          securities(*)
        )
      `)
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    console.log('Portfolio with securities:', { 
      portfolioId: portfolio?.id, 
      name: portfolio?.name, 
      securitiesCount: portfolio?.portfolio_securities?.length,
      error: portfolioError 
    });

    if (portfolioError || !portfolio) {
      console.error('Portfolio fetch error:', portfolioError);
      return NextResponse.json({ 
        error: 'Portfolio not found',
        details: portfolioError?.message 
      }, { status: 404 });
    }

    // Transform portfolio data for AI analysis
    const portfolioData = {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      securities: portfolio.portfolio_securities?.map((ps: any) => ({
        id: ps.securities.id,
        ticker: ps.securities.ticker,
        name: ps.securities.name,
        shares: ps.shares,
        average_cost: ps.average_cost,
        price: ps.securities.price,
        market_value: ps.shares * ps.securities.price,
        dividend: ps.securities.dividend,
        yield: ps.securities.yield,
        sector: ps.securities.sector
      })) || []
    };

    console.log('Transformed portfolio data:', {
      id: portfolioData.id,
      name: portfolioData.name,
      securitiesCount: portfolioData.securities.length,
      hasSecurities: portfolioData.securities.length > 0
    });

    // Check for cached analysis if not forcing refresh
    if (!forceRefresh) {
      try {
        const cachedAnalysis = await aiAnalysisCacheService.getCachedAnalysis(
          portfolioId,
          user.id,
          'portfolio_analysis',
          supabase
        );

        if (cachedAnalysis) {
          // Check if portfolio has changed since last analysis
          const hasChanged = await aiAnalysisCacheService.hasPortfolioChanged(
            portfolioId,
            user.id,
            portfolioData,
            'portfolio_analysis',
            supabase
          );

          if (!hasChanged) {
            console.log(`Returning cached analysis for portfolio ${portfolioId}`);
            return NextResponse.json({
              ...cachedAnalysis,
              message: 'Analysis retrieved from cache'
            });
          } else {
            console.log(`Portfolio has changed since last analysis for ${portfolioId}`);
          }
        }
      } catch (cacheError) {
        console.error('Cache check error:', cacheError);
        // Continue with fresh analysis if cache fails
      }
    }

    // Get AI client
    const anthropicClient = getAnthropicClient();
    
    // Prepare portfolio data for AI analysis
    const totalValue = portfolioData.securities.reduce((sum: number, sec: any) => sum + sec.market_value, 0);
    const totalDividend = portfolioData.securities.reduce((sum: number, sec: any) => sum + (sec.dividend * sec.shares), 0);
    const averageYield = totalValue > 0 ? (totalDividend / totalValue) * 100 : 0;

    const portfolioSummary = {
      name: portfolioData.name,
      totalValue: totalValue.toFixed(2),
      totalDividend: totalDividend.toFixed(2),
      averageYield: averageYield.toFixed(2),
      securities: portfolioData.securities.map((sec: any) => ({
        ticker: sec.ticker,
        name: sec.name,
        shares: sec.shares,
        price: sec.price,
        marketValue: sec.market_value.toFixed(2),
        dividend: sec.dividend,
        yield: sec.yield,
        sector: sec.sector
      }))
    };

    console.log('Portfolio summary for AI:', portfolioSummary);

    // Create AI prompt
    const prompt = `Analyze this income-focused investment portfolio and provide insights on:

Portfolio Summary:
- Name: ${portfolioSummary.name}
- Total Value: $${portfolioSummary.totalValue}
- Total Annual Dividend: $${portfolioSummary.totalDividend}
- Average Yield: ${portfolioSummary.averageYield}%

Securities:
${portfolioSummary.securities.length > 0 ? 
  portfolioSummary.securities.map((sec: any) => 
    `- ${sec.ticker} (${sec.name}): ${sec.shares} shares @ $${sec.price}, Market Value: $${sec.marketValue}, Dividend: $${sec.dividend} (${sec.yield}% yield), Sector: ${sec.sector}`
  ).join('\n') :
  'No securities currently in this portfolio.'
}

Please provide:
1. Overall portfolio assessment and income potential
2. Diversification analysis across sectors
3. Risk assessment and potential concerns
4. Suggestions for improvement or optimization
5. Key strengths and areas for attention

Focus on income generation, dividend sustainability, and long-term stability.`;

    console.log('Sending request to Anthropic API...');
    
    try {
      // Make AI request
      const response = await anthropicClient.analyzePortfolio(portfolioData);
      
      console.log('AI response received:', {
        hasContent: !!response.content,
        contentLength: response.content?.length,
        usage: response.usage,
        model: response.model
      });
      
      // Store analysis in cache
      let cacheId = null;
      try {
        cacheId = await aiAnalysisCacheService.storeAnalysis(
          portfolioId,
          user.id,
          portfolioData,
          {
            analysis: response.content,
            usage: response.usage!,
            model: response.model,
            timestamp: response.timestamp.toISOString()
          },
          'portfolio_analysis',
          supabase
        );
        console.log(`AI analysis cached with ID: ${cacheId}`);
      } catch (cacheError) {
        console.error('Cache storage error:', cacheError);
        // Continue even if caching fails
      }

      return NextResponse.json({
        analysis: response.content,
        usage: response.usage,
        model: response.model,
        timestamp: response.timestamp.toISOString(),
        cache_id: cacheId,
        message: 'Fresh analysis generated'
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      return NextResponse.json({ 
        error: 'AI analysis failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in AI analysis:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Create Supabase client with token
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
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // List all portfolios for the user
    const { data: portfolios, error: portfoliosError } = await supabase
      .from('portfolios')
      .select('id, name, user_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (portfoliosError) {
      console.error('Error fetching portfolios:', portfoliosError);
      return NextResponse.json({ 
        error: 'Failed to fetch portfolios',
        details: portfoliosError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      userId: user.id,
      portfolios: portfolios || [],
      count: portfolios?.length || 0
    });

  } catch (error) {
    console.error('Error in portfolio list:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 