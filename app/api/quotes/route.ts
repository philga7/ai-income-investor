import { NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

// Mark this route as public
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json({ error: 'Symbol is required' }, { status: 400 });
  }

  try {
    const quote = await financialService.getQuote(symbol);
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch quote' },
      { status: 500 }
    );
  }
} 