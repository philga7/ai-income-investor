import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; securityId: string }> }
): Promise<NextResponse> {
  try {
    const { id: portfolioId, securityId } = await params;
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
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Verify portfolio exists and belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || portfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch lots for the security
    const { data: lots, error: lotsError } = await supabase
      .from('security_lots')
      .select('*')
      .eq('portfolio_id', portfolioId)
      .eq('security_id', securityId)
      .order('open_date', { ascending: true });

    if (lotsError) {
      console.error('Error fetching lots:', lotsError);
      return NextResponse.json(
        { error: 'Failed to fetch lots' },
        { status: 500 }
      );
    }

    return NextResponse.json(lots || []);
  } catch (error) {
    console.error('Error in lots fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; securityId: string }> }
): Promise<NextResponse> {
  try {
    const { id: portfolioId, securityId } = await params;
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
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Verify portfolio exists and belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', portfolioId)
      .single();

    if (portfolioError || portfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Portfolio not found or access denied' },
        { status: 404 }
      );
    }

    // Get request body
    const body = await request.json();
    const { lots } = body;

    if (!lots || !Array.isArray(lots) || lots.length === 0) {
      return NextResponse.json(
        { error: 'Invalid lots data' },
        { status: 400 }
      );
    }

    // Development logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating lots:', lots.map(lot => ({
        open_date: lot.open_date,
        quantity: lot.quantity,
        price_per_share: lot.price_per_share,
        quantity_type: typeof lot.quantity,
        price_type: typeof lot.price_per_share
      })));
    }

    // Validate lot data
    for (const lot of lots) {
      if (!lot.open_date || !lot.quantity || !lot.price_per_share) {
        return NextResponse.json(
          { error: 'Missing required fields in lot data' },
          { status: 400 }
        );
      }

      // Validate quantity is a positive number (supports fractional shares)
      const quantity = parseFloat(lot.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        return NextResponse.json(
          { error: `Invalid quantity: ${lot.quantity}. Must be a positive number.` },
          { status: 400 }
        );
      }

      // Validate price_per_share is a positive number
      const pricePerShare = parseFloat(lot.price_per_share);
      if (isNaN(pricePerShare) || pricePerShare <= 0) {
        return NextResponse.json(
          { error: `Invalid price_per_share: ${lot.price_per_share}. Must be a positive number.` },
          { status: 400 }
        );
      }
    }

    // Create lots
    const lotsToInsert = lots.map(lot => {
      // Handle date conversion - convert timestamp to date string if needed
      let openDate: string = String(lot.open_date);
      if (typeof lot.open_date === 'number' || (typeof lot.open_date === 'string' && /^\d{13,}$/.test(lot.open_date))) {
        // It's a timestamp, convert to date string
        const date = new Date(parseInt(String(lot.open_date)));
        openDate = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      }

      const quantity = parseFloat(lot.quantity);
      const pricePerShare = parseFloat(lot.price_per_share);

      return {
        portfolio_id: portfolioId,
        security_id: securityId,
        open_date: openDate,
        quantity: quantity,
        price_per_share: pricePerShare,
        total_amount: quantity * pricePerShare,
        notes: lot.notes || null
      };
    });

    const { data: createdLots, error: createError } = await supabase
      .from('security_lots')
      .insert(lotsToInsert)
      .select();

    if (createError) {
      console.error('Error creating lots:', createError);
      return NextResponse.json(
        { error: 'Failed to create lots' },
        { status: 500 }
      );
    }

    return NextResponse.json(createdLots);
  } catch (error) {
    console.error('Error in lots creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 