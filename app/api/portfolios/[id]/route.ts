import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { portfolioDataService } from '@/src/services/portfolioDataService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    
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

    // Use the centralized TTL-based mechanism to fetch securities with automatic fundamentals refresh
    let portfolioSecurities;
    try {
      portfolioSecurities = await portfolioDataService.updatePortfolioSecurities(id, supabase, token);
    } catch (error) {
      console.error('Error calling updatePortfolioSecurities:', error);
      // Fallback to a simple query to get basic securities data
      const { data: fallbackSecurities, error: fallbackError } = await supabase
        .from('portfolio_securities')
        .select(`
          id,
          security_id,
          shares,
          average_cost,
          security:securities (
            id,
            ticker,
            name,
            sector,
            price,
            yield
          )
        `)
        .eq('portfolio_id', id);

      if (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new Error('Failed to fetch portfolio securities');
      }

      portfolioSecurities = fallbackSecurities?.map((ps: any) => ({
        id: ps.id,
        shares: ps.shares,
        average_cost: ps.average_cost,
        security: ps.security
      })) || [];
    }

    // Transform the data to include securities in the expected format
    const transformedPortfolio = {
      ...portfolio,
      securities: portfolioSecurities.map((ps) => ({
        id: ps.id,
        shares: ps.shares,
        average_cost: ps.average_cost,
        security: ps.security
      }))
    };

    return NextResponse.json(transformedPortfolio);
  } catch (error) {
    console.error('Error in portfolio fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    const { data: updatedPortfolio, error: updateError } = await supabase
      .from('portfolios')
      .update({
        name,
        description: description || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating portfolio:', updateError);
      return NextResponse.json(
        { error: 'Failed to update portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedPortfolio);
  } catch (error) {
    console.error('Error in portfolio update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
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
        { error: 'Unauthorized - You do not have permission to delete this portfolio' },
        { status: 403 }
      );
    }

    // Delete all portfolio securities first
    const { error: securitiesDeleteError } = await supabase
      .from('portfolio_securities')
      .delete()
      .eq('portfolio_id', id);

    if (securitiesDeleteError) {
      console.error('Error deleting portfolio securities:', securitiesDeleteError);
      return NextResponse.json(
        { error: 'Failed to delete portfolio securities' },
        { status: 500 }
      );
    }

    // Delete the portfolio
    const { error: deleteError } = await supabase
      .from('portfolios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting portfolio:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete portfolio' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in portfolio deletion:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 