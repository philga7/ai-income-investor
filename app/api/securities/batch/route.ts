import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error verifying token:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      );
    }

    const { tickers } = await request.json();

    if (!Array.isArray(tickers)) {
      return NextResponse.json(
        { error: 'Invalid request - tickers must be an array' },
        { status: 400 }
      );
    }

    const results = await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const quoteSummary = await yahooFinanceClient.getQuoteSummary(ticker);
          return { ticker, data: quoteSummary };
        } catch (error) {
          console.error(`Error fetching data for ${ticker}:`, error);
          return { ticker, error: 'Failed to fetch data' };
        }
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error fetching securities data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch securities data' },
      { status: 500 }
    );
  }
} 