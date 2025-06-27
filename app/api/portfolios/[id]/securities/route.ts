import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityService } from '@/src/services/securityDataService';
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

    // Use the centralized TTL-based mechanism to fetch securities with automatic fundamentals refresh
    const portfolioSecurities = await portfolioDataService.updatePortfolioSecurities(id, supabase, token);

    // Transform the data to ensure numeric values
    const transformedSecurities = portfolioSecurities.map((ps) => ({
      id: ps.id,
      portfolio_id: id,
      security_id: ps.security.id,
      shares: Number(ps.shares),
      average_cost: Number(ps.average_cost),
      security: ps.security
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
      // Get real-time security data with full fundamentals
      const securityData = await securityService.getSecurityData(ticker);
      console.log('POST /api/portfolios/[id]/securities - Got security data:', securityData);

      if (!securityData) {
        console.error('POST /api/portfolios/[id]/securities - Failed to get security data');
        return NextResponse.json(
          { error: 'Failed to fetch security data' },
          { status: 500 }
        );
      }

      // Create a new security with complete fundamental data
      const { data: newSecurity, error: createSecurityError } = await supabase
        .from('securities')
        .insert([
          {
            ticker: ticker,
            name: securityData.name,
            sector: securityData.sector,
            industry: securityData.industry,
            address1: securityData.address1,
            city: securityData.city,
            state: securityData.state,
            zip: securityData.zip,
            country: securityData.country,
            phone: securityData.phone,
            website: securityData.website,
            industry_key: securityData.industry_key,
            industry_disp: securityData.industry_disp,
            sector_key: securityData.sector_key,
            sector_disp: securityData.sector_disp,
            long_business_summary: securityData.long_business_summary,
            full_time_employees: securityData.full_time_employees,
            audit_risk: securityData.audit_risk,
            board_risk: securityData.board_risk,
            compensation_risk: securityData.compensation_risk,
            shareholder_rights_risk: securityData.shareholder_rights_risk,
            overall_risk: securityData.overall_risk,
            governance_epoch_date: securityData.governance_epoch_date,
            compensation_as_of_epoch_date: securityData.compensation_as_of_epoch_date,
            ir_website: securityData.ir_website,
            price: securityData.price,
            prev_close: securityData.prev_close,
            open: securityData.open,
            volume: securityData.volume,
            market_cap: securityData.market_cap,
            pe: securityData.pe,
            eps: securityData.eps,
            dividend: securityData.dividend,
            yield: securityData.yield,
            dividend_growth_5yr: securityData.dividend_growth_5yr,
            payout_ratio: securityData.payout_ratio,
            sma200: securityData.sma200,
            tags: securityData.tags,
            ex_dividend_date: securityData.ex_dividend_date,
            operating_cash_flow: securityData.operating_cash_flow,
            free_cash_flow: securityData.free_cash_flow,
            cash_flow_growth: securityData.cash_flow_growth,
            target_low_price: securityData.target_low_price,
            target_high_price: securityData.target_high_price,
            recommendation_key: securityData.recommendation_key,
            number_of_analyst_opinions: securityData.number_of_analyst_opinions,
            total_cash: securityData.total_cash,
            total_debt: securityData.total_debt,
            current_ratio: securityData.current_ratio,
            quick_ratio: securityData.quick_ratio,
            debt_to_equity: securityData.debt_to_equity,
            return_on_equity: securityData.return_on_equity,
            earnings_growth: securityData.earnings_growth,
            revenue_growth: securityData.revenue_growth,
            operating_margins: securityData.operating_margins,
            profit_margins: securityData.profit_margins,
            total_assets: securityData.total_assets,
            total_current_assets: securityData.total_current_assets,
            total_liabilities: securityData.total_liabilities,
            total_current_liabilities: securityData.total_current_liabilities,
            total_stockholder_equity: securityData.total_stockholder_equity,
            cash: securityData.cash,
            short_term_investments: securityData.short_term_investments,
            net_receivables: securityData.net_receivables,
            inventory: securityData.inventory,
            other_current_assets: securityData.other_current_assets,
            long_term_investments: securityData.long_term_investments,
            property_plant_equipment: securityData.property_plant_equipment,
            other_assets: securityData.other_assets,
            intangible_assets: securityData.intangible_assets,
            goodwill: securityData.goodwill,
            accounts_payable: securityData.accounts_payable,
            short_long_term_debt: securityData.short_long_term_debt,
            other_current_liabilities: securityData.other_current_liabilities,
            long_term_debt: securityData.long_term_debt,
            other_liabilities: securityData.other_liabilities,
            minority_interest: securityData.minority_interest,
            treasury_stock: securityData.treasury_stock,
            retained_earnings: securityData.retained_earnings,
            common_stock: securityData.common_stock,
            capital_surplus: securityData.capital_surplus,
            earnings: securityData.earnings,
            last_fetched: securityData.last_fetched,
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