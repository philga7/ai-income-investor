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
    console.log(`Fetching dividend data for ticker: ${ticker}`);
    
    try {
      const quoteSummary = await yahooFinanceClient.getQuoteSummary(ticker, [
        'summaryDetail',
        'defaultKeyStatistics',
        'calendarEvents'
      ]);

      console.log(`Received quote summary for ${ticker}:`, {
        hasSummaryDetail: !!quoteSummary.summaryDetail,
        hasCalendarEvents: !!quoteSummary.calendarEvents,
        summaryDetailKeys: quoteSummary.summaryDetail ? Object.keys(quoteSummary.summaryDetail) : [],
        calendarEventsKeys: quoteSummary.calendarEvents ? Object.keys(quoteSummary.calendarEvents) : [],
        dividendRate: quoteSummary.summaryDetail?.dividendRate,
        dividendYield: quoteSummary.summaryDetail?.dividendYield,
        exDividendDate: quoteSummary.summaryDetail?.exDividendDate,
        calendarExDividendDate: quoteSummary.calendarEvents?.exDividendDate
      });

      // Check if we have valid summary detail data
      if (!quoteSummary.summaryDetail) {
        console.warn(`No summary detail data available for ${ticker}`);
        return NextResponse.json({
          currentDividend: 0,
          yield: 0,
          exDividendDate: null,
          payoutRatio: 0,
          fiveYearAvgYield: 0,
          growthRate: 0,
        });
      }

      const dividendRate = quoteSummary.summaryDetail?.dividendRate || 0;
      const dividendYield = quoteSummary.summaryDetail?.dividendYield || 0;
      // Try to get exDividendDate from summaryDetail, then calendarEvents
      let exDividendDate = quoteSummary.summaryDetail?.exDividendDate;
      if (!exDividendDate && quoteSummary.calendarEvents?.exDividendDate) {
        exDividendDate = quoteSummary.calendarEvents.exDividendDate;
      }
      const payoutRatio = quoteSummary.summaryDetail?.payoutRatio || 0;
      const fiveYearAvgDividendYield = quoteSummary.summaryDetail?.fiveYearAvgDividendYield || 0;

      // Calculate dividend growth rate
      const dividendGrowth = fiveYearAvgDividendYield > 0 
        ? ((dividendYield - fiveYearAvgDividendYield) / fiveYearAvgDividendYield) * 100 
        : 0;

      // Safely convert ex-dividend date
      let formattedExDividendDate = null;
      if (exDividendDate) {
        try {
          let timestamp = Number(exDividendDate);
          if (!isNaN(timestamp) && timestamp > 0) {
            // If timestamp is in milliseconds, convert to seconds
            if (timestamp > 1e12) {
              timestamp = Math.floor(timestamp / 1000);
            }
            const date = new Date(timestamp * 1000);
            
            // Validate the date is reasonable
            if (!isNaN(date.getTime()) && date.getFullYear() >= 1900 && date.getFullYear() <= 2100) {
              formattedExDividendDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
            } else {
              console.warn(`Invalid ex-dividend date for ${ticker}: ${exDividendDate} -> ${date}`);
            }
          } else {
            console.warn(`Invalid timestamp for ${ticker}: ${exDividendDate}`);
          }
        } catch (error) {
          console.warn(`Error parsing ex-dividend date for ${ticker}: ${exDividendDate}`, error);
        }
      }

      return NextResponse.json({
        currentDividend: dividendRate,
        yield: dividendYield * 100, // Convert to percentage
        exDividendDate: formattedExDividendDate,
        payoutRatio: payoutRatio * 100, // Convert to percentage
        fiveYearAvgYield: fiveYearAvgDividendYield * 100, // Convert to percentage
        growthRate: dividendGrowth,
      });
    } catch (yahooError) {
      const yahooErrorMessage = yahooError instanceof Error ? yahooError.message : String(yahooError);
      console.error(`Yahoo Finance error for ${ticker}:`, {
        error: yahooError,
        message: yahooErrorMessage,
        stack: yahooError instanceof Error ? yahooError.stack : undefined
      });
      
      // Return default values instead of throwing an error
      // This allows the process to continue with other securities
      console.warn(`Returning default values for ${ticker} due to Yahoo Finance error`);
      return NextResponse.json({
        currentDividend: 0,
        yield: 0,
        exDividendDate: null,
        payoutRatio: 0,
        fiveYearAvgYield: 0,
        growthRate: 0,
      });
    }
  } catch (error) {
    console.error('Error fetching dividend data for ticker:', ticker, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ticker
    });
    
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
      { error: `Failed to fetch dividend data: ${errorMessage}` },
      { status: 500 }
    );
  }
} 