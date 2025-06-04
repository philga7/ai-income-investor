import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const securityId = searchParams.get('securityId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!securityId) {
      return NextResponse.json({ error: 'Security ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('dividends')
      .select('*')
      .eq('security_id', securityId)
      .order('payment_date', { ascending: false });

    if (startDate) {
      query = query.gte('payment_date', startDate);
    }

    if (endDate) {
      query = query.lte('payment_date', endDate);
    }

    const { data: dividends, error } = await query;

    if (error) {
      console.error('Error fetching dividends:', error);
      return NextResponse.json({ error: 'Failed to fetch dividends' }, { status: 500 });
    }

    return NextResponse.json(dividends || []);
  } catch (error) {
    console.error('Error in dividends API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 