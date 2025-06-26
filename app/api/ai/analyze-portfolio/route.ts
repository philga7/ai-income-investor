import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAnthropicClient } from '@/lib/ai/anthropic-client';
import { aiAnalysisCacheService } from '@/src/services/aiAnalysisCacheService';
import { enhancedPortfolioAnalysisService, AIAnalysisRequest } from '@/src/services/enhancedPortfolioAnalysisService';
import { portfolioDataService } from '@/src/services/portfolioDataService';

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

    const { portfolioId, forceRefresh = false, analysisType = 'comprehensive' } = await request.json();
    
    if (!portfolioId) {
      return NextResponse.json({ error: 'Portfolio ID is required' }, { status: 400 });
    }

    console.log(`Enhanced AI Analysis requested for portfolio ${portfolioId} by user ${user.id}, type: ${analysisType}`);

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

    // Fetch portfolio data with securities using centralized TTL mechanism
    const portfolioSecurities = await portfolioDataService.updatePortfolioSecurities(portfolioId, supabase, token);
    
    // Get basic portfolio info
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .eq('user_id', user.id)
      .single();

    console.log('Portfolio with securities:', { 
      portfolioId: portfolio?.id, 
      name: portfolio?.name, 
      securitiesCount: portfolioSecurities?.length,
      error: portfolioError 
    });

    if (portfolioError || !portfolio) {
      console.error('Portfolio fetch error:', portfolioError);
      return NextResponse.json({ 
        error: 'Portfolio not found',
        details: portfolioError?.message 
      }, { status: 404 });
    }

    // Transform portfolio data for enhanced analysis
    const portfolioData = {
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

    // Generate enhanced portfolio analysis
    console.log('Generating enhanced portfolio analysis...');
    const enhancedAnalysis = await enhancedPortfolioAnalysisService.generateEnhancedAnalysis(
      portfolioData,
      analysisType as AIAnalysisRequest['analysisType']
    );

    // Get AI client
    const anthropicClient = getAnthropicClient();
    
    // Format analysis data for AI consumption with dividend timing focus
    const formattedAnalysis = enhancedPortfolioAnalysisService.formatForAIAnalysis(enhancedAnalysis);

    // Create AI prompt with dividend timing focus
    const prompt = `Analyze this income-focused investment portfolio with special attention to dividend timing and reliability:

${formattedAnalysis}

Please provide a comprehensive analysis focusing on:

1. **Dividend Timing Analysis:**
   - When are the next dividend payments expected?
   - Which securities have upcoming ex-dividend dates?
   - How does the dividend calendar look for the next 30-90 days?

2. **Dividend Reliability Assessment:**
   - Which securities have the most reliable dividend payments?
   - Are there any concerns about dividend sustainability?
   - How does the payout ratio health look across the portfolio?

3. **Portfolio Optimization:**
   - Suggestions for improving dividend income
   - Recommendations for timing new purchases around ex-dividend dates
   - Opportunities to increase yield while maintaining quality

4. **Risk Assessment:**
   - Dividend cut risk analysis
   - Sector concentration concerns
   - Overall portfolio stability

5. **Actionable Recommendations:**
   - Specific buy/sell/hold recommendations with reasoning
   - Timing suggestions for dividend capture strategies
   - Portfolio rebalancing opportunities

Focus on providing actionable insights for dividend investors who want to maximize income while maintaining portfolio stability.`;

    console.log('Sending enhanced request to Anthropic API...');
    
    try {
      // Make AI request
      const response = await anthropicClient.generateResponse({
        prompt,
        systemPrompt: `You are an expert dividend portfolio analyst specializing in income-focused investing. 
        
Your analysis should be:
- Dividend-focused and timing-aware
- Actionable with specific recommendations
- Risk-aware and conservative
- Based on fundamental analysis
- Clear and concise

Structure your response with clear sections for timing analysis, reliability assessment, recommendations, and risk factors.`,
        context: { enhancedAnalysis }
      });
      
      console.log('AI response received:', {
        hasContent: !!response.content,
        contentLength: response.content?.length,
        usage: response.usage,
        model: response.model
      });
      
      // Parse AI response into structured format
      const parsedResponse = enhancedPortfolioAnalysisService.parseAIResponse(
        response.content!,
        response.usage!,
        response.model
      );
      
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
        ...parsedResponse,
        cache_id: cacheId,
        message: 'Enhanced analysis generated with dividend timing focus'
      });
    } catch (aiError) {
      console.error('AI analysis error:', aiError);
      return NextResponse.json({ 
        error: 'AI analysis failed',
        details: aiError instanceof Error ? aiError.message : 'Unknown AI error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in enhanced AI analysis:', error);
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