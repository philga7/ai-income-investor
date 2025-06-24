import { NextResponse } from 'next/server';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  let ticker: string | null = null;
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // Fetch dividend history from Yahoo Finance using the client
    const quoteSummary = await yahooFinanceClient.getQuoteSummary(ticker, [
      'summaryDetail',
      'defaultKeyStatistics'
    ]);

    const dividendRate = quoteSummary.summaryDetail?.dividendRate || 0;
    const dividendYield = quoteSummary.summaryDetail?.dividendYield || 0;
    const exDividendDate = quoteSummary.summaryDetail?.exDividendDate;
    const payoutRatio = quoteSummary.summaryDetail?.payoutRatio || 0;
    const fiveYearAvgDividendYield = quoteSummary.summaryDetail?.fiveYearAvgDividendYield || 0;

    // Calculate dividend growth rate
    const dividendGrowth = fiveYearAvgDividendYield > 0 
      ? ((dividendYield - fiveYearAvgDividendYield) / fiveYearAvgDividendYield) * 100 
      : 0;

    return NextResponse.json({
      currentDividend: dividendRate,
      yield: dividendYield * 100, // Convert to percentage
      exDividendDate: exDividendDate ? new Date(Number(exDividendDate) * 1000).toISOString() : null,
      payoutRatio: payoutRatio * 100, // Convert to percentage
      fiveYearAvgYield: fiveYearAvgDividendYield * 100, // Convert to percentage
      growthRate: dividendGrowth,
    });
  } catch (error) {
    console.error('Error fetching dividend data for ticker:', ticker, error);
    
    // Provide more specific error messages based on the error type
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('Invalid Crumb') || errorMessage.includes('invalid crumb')) {
      return NextResponse.json(
        { error: 'Yahoo Finance API authentication error. Please try again in a moment.' },
        { status: 503 }
      );
    }
    
    if (errorMessage.includes('Invalid symbol') || errorMessage.includes('invalid symbol')) {
      return NextResponse.json(
        { error: `Invalid ticker: ${ticker}` },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch dividend data' },
      { status: 500 }
    );
  }
} 