import { NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
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
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // Fetch dividend history from Yahoo Finance
    const quoteSummary = await yahooFinance.quoteSummary(ticker, {
      modules: ['summaryDetail', 'defaultKeyStatistics']
    });

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
    console.error('Error fetching dividend data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dividend data' },
      { status: 500 }
    );
  }
} 