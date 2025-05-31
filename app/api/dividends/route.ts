import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ticker = searchParams.get('ticker');

    if (!ticker) {
      return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
    }

    // For now, return mock data
    // TODO: Replace with actual database query
    const mockDividends = [
      {
        date: '2024-03-15',
        amount: 0.75,
        yield: 2.8,
        growth: 5.2,
        status: 'upcoming'
      },
      {
        date: '2023-12-15',
        amount: 0.71,
        yield: 2.7,
        growth: 4.8,
        status: 'paid'
      },
      {
        date: '2023-09-15',
        amount: 0.68,
        yield: 2.6,
        growth: 4.5,
        status: 'paid'
      },
      {
        date: '2023-06-15',
        amount: 0.65,
        yield: 2.5,
        growth: 4.2,
        status: 'paid'
      },
      {
        date: '2023-03-15',
        amount: 0.62,
        yield: 2.4,
        growth: 4.0,
        status: 'paid'
      }
    ];

    return NextResponse.json(mockDividends);
  } catch (error) {
    console.error('Error fetching dividend history:', error);
    return NextResponse.json({ error: 'Failed to fetch dividend history' }, { status: 500 });
  }
} 