import { NextRequest, NextResponse } from 'next/server';
import { technicalAnalysisService } from '@/src/services/technicalAnalysisService';
import { technicalAnalysisCacheService } from '@/src/services/technicalAnalysisCacheService';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    console.log('Technical Analysis API: Request received');
    
    const authHeader = request.headers.get('Authorization');
    console.log('Technical Analysis API: Auth header:', authHeader ? 'present' : 'missing');

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('Technical Analysis API: No valid Bearer token');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('Technical Analysis API: Token extracted, length:', token.length);
    
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
    
    console.log('Technical Analysis API: Verifying user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Technical Analysis API: Error verifying token:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('Technical Analysis API: No user found');
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      );
    }

    console.log('Technical Analysis API: User authenticated:', user.id);

    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const type = searchParams.get('type') as 'buy' | 'sell' | undefined;
    const limit = parseInt(searchParams.get('limit') || '5');

    console.log('Technical Analysis API: Parameters:', { symbol, type, limit });

    if (symbol) {
      // Get technical analysis for a specific symbol
      console.log('Technical Analysis API: Getting analysis for symbol:', symbol);
      
      // Check cache first
      const cachedAnalysis = technicalAnalysisCacheService.getCachedAnalysis(symbol);
      if (cachedAnalysis) {
        console.log('Technical Analysis API: Returning cached analysis for symbol:', symbol);
        return NextResponse.json(cachedAnalysis);
      }
      
      // Cache miss - perform fresh analysis
      console.log('Technical Analysis API: Cache miss, performing fresh analysis for symbol:', symbol);
      
      // Log cache statistics for debugging
      const cacheStats = technicalAnalysisCacheService.getCacheStats();
      console.log('Technical Analysis API: Cache stats:', cacheStats);
      
      const analysis = await technicalAnalysisService.getTechnicalAnalysis(symbol);
      
      // Cache the result
      technicalAnalysisCacheService.setCachedAnalysis(symbol, analysis);
      
      console.log('Technical Analysis API: Analysis complete for symbol:', symbol);
      return NextResponse.json(analysis);
    } else {
      // Get user's portfolio securities for analysis
      console.log('Technical Analysis API: Fetching user portfolio securities...');
      
      // Check cache for opportunities first
      const cachedOpportunities = technicalAnalysisCacheService.getCachedOpportunities();
      if (cachedOpportunities) {
        console.log('Technical Analysis API: Returning cached opportunities');
        const filteredOpportunities = type === 'buy' 
          ? cachedOpportunities.buyOpportunities 
          : type === 'sell' 
            ? cachedOpportunities.sellOpportunities 
            : [...cachedOpportunities.buyOpportunities, ...cachedOpportunities.sellOpportunities];
        
        return NextResponse.json(filteredOpportunities.slice(0, limit));
      }
      
      // Cache miss - fetch fresh data
      console.log('Technical Analysis API: Cache miss, fetching fresh opportunities...');
      
      // Get all portfolios for the user
      const { data: portfolios, error: portfoliosError } = await supabase
        .from('portfolios')
        .select('id, name')
        .eq('user_id', user.id);

      if (portfoliosError) {
        console.error('Technical Analysis API: Error fetching portfolios:', portfoliosError);
        return NextResponse.json(
          { error: 'Failed to fetch portfolios' },
          { status: 500 }
        );
      }

      if (!portfolios || portfolios.length === 0) {
        console.log('Technical Analysis API: No portfolios found for user');
        return NextResponse.json([]);
      }

      // Get all securities from all user portfolios
      const portfolioIds = portfolios.map(p => p.id);
      const { data: portfolioSecurities, error: securitiesError } = await supabase
        .from('portfolio_securities')
        .select(`
          id,
          shares,
          average_cost,
          security:securities (
            id,
            ticker,
            name,
            price,
            sector,
            industry
          )
        `)
        .in('portfolio_id', portfolioIds);

      if (securitiesError) {
        console.error('Technical Analysis API: Error fetching portfolio securities:', securitiesError);
        return NextResponse.json(
          { error: 'Failed to fetch portfolio securities' },
          { status: 500 }
        );
      }

      if (!portfolioSecurities || portfolioSecurities.length === 0) {
        console.log('Technical Analysis API: No securities found in portfolios');
        return NextResponse.json([]);
      }

      // Extract unique tickers from portfolio securities
      const userSymbols = Array.from(new Set(portfolioSecurities.map(ps => (ps.security as any).ticker)));
      console.log('Technical Analysis API: User portfolio symbols:', userSymbols);

      if (userSymbols.length === 0) {
        console.log('Technical Analysis API: No symbols found in portfolios');
        return NextResponse.json([]);
      }

      // Get top opportunities from user's portfolio securities
      console.log('Technical Analysis API: Getting top opportunities for type:', type, 'from user symbols');
      
      // OPTIMIZED: Perform batch analysis once and cache all results
      console.log('Technical Analysis API: Performing batch analysis for all symbols...');
      const allAnalyses = await technicalAnalysisService.batchAnalyzeSymbols(userSymbols);
      
      // Cache all individual symbol analyses
      console.log('Technical Analysis API: Caching individual symbol analyses...');
      for (const analysis of allAnalyses) {
        if (analysis && analysis.symbol) {
          technicalAnalysisCacheService.setCachedAnalysis(analysis.symbol, analysis);
          console.log(`Technical Analysis API: Cached analysis for ${analysis.symbol}`);
        }
      }
      
      // Log final cache statistics
      const finalCacheStats = technicalAnalysisCacheService.getCacheStats();
      console.log('Technical Analysis API: Final cache stats after batch analysis:', finalCacheStats);
      
      // Filter for buy and sell opportunities
      const buyOpportunities = allAnalyses
        .filter(analysis => analysis.overallSignal === 'buy')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);
        
      const sellOpportunities = allAnalyses
        .filter(analysis => analysis.overallSignal === 'sell')
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 10);
      
      // Cache the opportunities
      technicalAnalysisCacheService.setCachedOpportunities(buyOpportunities, sellOpportunities);
      
      console.log(`Technical Analysis API: Analysis complete. Found ${buyOpportunities.length} buy and ${sellOpportunities.length} sell opportunities.`);

      // Return filtered results based on type
      const filteredOpportunities = type === 'buy' 
        ? buyOpportunities 
        : type === 'sell' 
          ? sellOpportunities 
          : [...buyOpportunities, ...sellOpportunities];
      
      console.log('Technical Analysis API: Opportunities found:', filteredOpportunities.length);
      return NextResponse.json(filteredOpportunities.slice(0, limit));
    }
  } catch (error) {
    console.error('Technical Analysis API: Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 