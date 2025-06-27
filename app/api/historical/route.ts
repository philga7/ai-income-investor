import { NextResponse } from 'next/server';
import { financialService } from '@/src/services/financialService';
import { handleYahooFinanceError } from '@/lib/financial/api/errors';

// Mark this route as public
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const interval = searchParams.get('interval') as '1d' | '1wk' | '1mo' || '1d';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const data = await financialService.getHistoricalData(
      symbol,
      new Date(startDate),
      new Date(endDate),
      interval
    );

    return NextResponse.json(data);
  } catch (error) {
    return handleYahooFinanceError(error);
  }
} 