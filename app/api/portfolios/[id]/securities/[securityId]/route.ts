import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; securityId: string }> }
): Promise<NextResponse> {
  try {
    const { id, securityId } = await params;
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

    // Verify portfolio exists and belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .single();

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have permission to view this portfolio' },
        { status: 403 }
      );
    }

    // Fetch portfolio security
    const { data: security, error: securityError } = await supabase
      .from('portfolio_securities')
      .select(`
        *,
        security:securities(*)
      `)
      .eq('portfolio_id', id)
      .eq('id', securityId)
      .single();

    if (securityError) {
      console.error('Error fetching security:', securityError);
      return NextResponse.json(
        { error: 'Security not found' },
        { status: 404 }
      );
    }

    // Transform the data to ensure numeric values
    const transformedSecurity = {
      ...security,
      shares: Number(security.shares),
      average_cost: Number(security.average_cost),
      security: {
        ...security.security,
        price: Number(security.security.price),
        yield: Number(security.security.yield)
      }
    };

    return NextResponse.json(transformedSecurity);
  } catch (error) {
    console.error('Error in security fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; securityId: string }> }
): Promise<NextResponse> {
  try {
    const { id, securityId } = await params;
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

    // Verify portfolio exists and belongs to user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('id', id)
      .single();

    if (portfolioError) {
      console.error('Error fetching portfolio:', portfolioError);
      return NextResponse.json(
        { error: 'Portfolio not found' },
        { status: 404 }
      );
    }

    if (portfolio.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized - You do not have permission to edit this portfolio' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { shares, average_cost } = body;

    if (!shares || !average_cost) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Update portfolio security
    const { data: updatedSecurity, error: updateError } = await supabase
      .from('portfolio_securities')
      .update({
        shares,
        average_cost,
        updated_at: new Date().toISOString()
      })
      .eq('portfolio_id', id)
      .eq('id', securityId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating security:', updateError);
      return NextResponse.json(
        { error: 'Failed to update security' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedSecurity);
  } catch (error) {
    console.error('Error in security update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 