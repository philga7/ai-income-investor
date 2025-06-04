import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityService } from '@/services/securityService';

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

    // Fetch portfolio securities with security details
    const { data: securities, error: securitiesError } = await supabase
      .from('portfolio_securities')
      .select(`
        *,
        security:securities(*)
      `)
      .eq('portfolio_id', id);

    if (securitiesError) {
      console.error('Error fetching securities:', securitiesError);
      return NextResponse.json(
        { error: 'Failed to fetch securities' },
        { status: 500 }
      );
    }

    // Transform the data to ensure numeric values
    const transformedSecurities = securities.map((security: any) => ({
      ...security,
      shares: Number(security.shares),
      average_cost: Number(security.average_cost),
      security: {
        ...security.security,
        price: Number(security.security.price),
        yield: Number(security.security.yield)
      }
    }));

    return NextResponse.json(transformedSecurities);
  } catch (error) {
    console.error('Error in securities fetch:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    console.log('POST /api/portfolios/[id]/securities - Starting request');
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('POST /api/portfolios/[id]/securities - No auth token');
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
      console.log('POST /api/portfolios/[id]/securities - Auth error:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('POST /api/portfolios/[id]/securities - No user found');
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
    const { ticker, shares, average_cost } = body;

    console.log('POST /api/portfolios/[id]/securities - Request body:', { ticker, shares, average_cost });

    if (!ticker || !shares || !average_cost) {
      console.log('POST /api/portfolios/[id]/securities - Missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if security exists
    let { data: security, error: securityError } = await supabase
      .from('securities')
      .select('*')
      .eq('ticker', ticker)
      .single();

    console.log('POST /api/portfolios/[id]/securities - Existing security check:', { security, securityError });

    // If security doesn't exist, create it
    if (securityError) {
      console.log('POST /api/portfolios/[id]/securities - Creating new security');
      // Get real-time security data
      const securityData = await securityService.getSecurityData(ticker);
      console.log('POST /api/portfolios/[id]/securities - Got security data:', securityData);

      // Create a new security with real-time data
      const { data: newSecurity, error: createSecurityError } = await supabase
        .from('securities')
        .insert([
          {
            ticker: ticker,
            name: securityData?.name || ticker,
            sector: securityData?.sector || 'Unknown',
            price: securityData?.price || average_cost,
            yield: securityData?.yield || 0,
            sma200: securityData?.sma200 || 'below',
            tags: securityData?.tags || [],
          }
        ])
        .select()
        .single();

      console.log('POST /api/portfolios/[id]/securities - Created new security:', { newSecurity, createSecurityError });

      if (createSecurityError) {
        console.error('API: Error creating security:', createSecurityError);
        console.error('API: Error details:', {
          code: createSecurityError.code,
          message: createSecurityError.message,
          details: createSecurityError.details,
          hint: createSecurityError.hint
        });
        return NextResponse.json(
          { error: `Failed to create security: ${createSecurityError.message}` },
          { status: 500 }
        );
      }

      if (!newSecurity) {
        // If no data returned but no error, try to fetch the security again
        const { data: fetchedSecurity, error: fetchError } = await supabase
          .from('securities')
          .select('*')
          .eq('ticker', ticker)
          .single();

        console.log('POST /api/portfolios/[id]/securities - Fetched new security:', { fetchedSecurity, fetchError });

        if (fetchError || !fetchedSecurity) {
          console.error('API: Failed to fetch newly created security:', fetchError);
          return NextResponse.json(
            { error: 'Failed to create security - could not verify creation' },
            { status: 500 }
          );
        }

        security = fetchedSecurity;
      } else {
        security = newSecurity;
      }
    } else {
      console.log('POST /api/portfolios/[id]/securities - Updating existing security');
      // Update existing security with real-time data
      const updatedSecurity = await securityService.updateSecurityData(security.id);
      console.log('POST /api/portfolios/[id]/securities - Updated security:', updatedSecurity);
      if (updatedSecurity) {
        security = updatedSecurity;
      }
    }

    // Check if security is already in portfolio
    const { data: existingSecurity, error: existingSecurityError } = await supabase
      .from('portfolio_securities')
      .select('*')
      .eq('portfolio_id', id)
      .eq('security_id', security.id)
      .single();

    if (existingSecurity) {
      return NextResponse.json(
        { error: 'Security already exists in portfolio' },
        { status: 400 }
      );
    }

    // Add security to portfolio
    const { data: portfolioSecurity, error: portfolioSecurityError } = await supabase
      .from('portfolio_securities')
      .insert([
        {
          portfolio_id: id,
          security_id: security.id,
          shares,
          average_cost,
        }
      ])
      .select()
      .single();

    if (portfolioSecurityError) {
      console.error('Error adding security to portfolio:', portfolioSecurityError);
      console.error('Error details:', {
        code: portfolioSecurityError.code,
        message: portfolioSecurityError.message,
        details: portfolioSecurityError.details,
        hint: portfolioSecurityError.hint
      });
      return NextResponse.json(
        { error: `Failed to add security to portfolio: ${portfolioSecurityError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(portfolioSecurity);
  } catch (error) {
    console.error('Error in security addition:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 