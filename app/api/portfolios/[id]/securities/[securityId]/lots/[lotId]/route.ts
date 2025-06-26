import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; securityId: string; lotId: string }> }
): Promise<NextResponse> {
  try {
    const { id: portfolioId, securityId, lotId } = await params;
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
    const { open_date, quantity, price_per_share, notes } = body;

    // Validate required fields
    if (!open_date || !quantity || !price_per_share) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total amount
    const total_amount = parseInt(quantity) * parseFloat(price_per_share);

    // Update the lot
    const { data: updatedLot, error: updateError } = await supabase
      .from('security_lots')
      .update({
        open_date,
        quantity: parseInt(quantity),
        price_per_share: parseFloat(price_per_share),
        total_amount,
        notes: notes || null
      })
      .eq('id', lotId)
      .eq('portfolio_id', portfolioId)
      .eq('security_id', securityId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lot:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lot' },
        { status: 500 }
      );
    }

    if (!updatedLot) {
      return NextResponse.json(
        { error: 'Lot not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedLot);
  } catch (error) {
    console.error('Error in lot update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; securityId: string; lotId: string }> }
): Promise<NextResponse> {
  try {
    const { id: portfolioId, securityId, lotId } = await params;
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

    // Delete the lot
    const { error: deleteError } = await supabase
      .from('security_lots')
      .delete()
      .eq('id', lotId)
      .eq('portfolio_id', portfolioId)
      .eq('security_id', securityId);

    if (deleteError) {
      console.error('Error deleting lot:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete lot' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in lot deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 