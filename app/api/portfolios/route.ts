import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('Starting portfolio creation request...');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the Authorization header
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header:', authHeader);

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No valid Authorization header found');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    console.log('Token received:', token.substring(0, 10) + '...');
    
    // Verify the token and get the user
    console.log('Verifying token with Supabase...');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError) {
      console.error('Error verifying token:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    if (!user) {
      console.log('No user found for token');
      return NextResponse.json(
        { error: 'Unauthorized - No user found' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Check if user has a profile
    console.log('Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error checking profile:', profileError);
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile first.' },
        { status: 400 }
      );
    }

    if (!profile) {
      console.log('No profile found for user');
      return NextResponse.json(
        { error: 'User profile not found. Please complete your profile first.' },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();
    console.log('Request body:', body);
    const { name, description } = body;

    // Validate required fields
    if (!name) {
      console.log('Portfolio name is missing');
      return NextResponse.json(
        { error: 'Portfolio name is required' },
        { status: 400 }
      );
    }

    // Create the portfolio with the authenticated user's ID
    console.log('Creating portfolio for user:', user.id);
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .insert([
        {
          user_id: user.id, // This should match auth.uid() in the RLS policy
          name,
          description: description || null,
        }
      ])
      .select()
      .single();

    if (portfolioError) {
      console.error('Error creating portfolio:', portfolioError);
      if (portfolioError.code === '42501') {
        return NextResponse.json(
          { error: 'Permission denied - You do not have permission to create portfolios' },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create portfolio' },
        { status: 500 }
      );
    }

    console.log('Portfolio created successfully:', portfolio);
    return NextResponse.json(portfolio);
  } catch (error) {
    console.error('Error in portfolio creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 