import { NextResponse } from 'next/server';
import { recommendationService } from '@/src/services/recommendationService';
import { handleYahooFinanceError } from '@/lib/financial/api/errors';

export async function GET(
  request: Request,
  context: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await context.params;
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol is required' },
        { status: 400 }
      );
    }

    const recommendation = await recommendationService.getRecommendationBySymbol(symbol);
    return NextResponse.json(recommendation);
  } catch (error) {
    return handleYahooFinanceError(error);
  }
} 