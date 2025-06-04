import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { yahooFinanceClient } from '@/lib/financial/api/yahoo/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
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

    const { ticker } = await params;
    const quoteSummary = await yahooFinanceClient.getQuoteSummary(ticker);
    
    if (!quoteSummary) {
      return NextResponse.json(
        { error: 'No data returned from Yahoo Finance' },
        { status: 404 }
      );
    }

    return NextResponse.json(quoteSummary);
  } catch (error) {
    console.error('Error fetching security data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
} 