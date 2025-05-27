import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check for session in cookies
  const { data: { session: cookieSession } } = await supabase.auth.getSession();

  // Check for token in Authorization header
  const authHeader = request.headers.get('Authorization');
  let headerSession = null;
  
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      headerSession = { user };
    }
  }

  // If the request is for an API route and there's no session in either cookies or header, return 401
  if (request.nextUrl.pathname.startsWith('/api/') && !cookieSession && !headerSession) {
    console.log('API request unauthorized - no valid session found');
    return NextResponse.json(
      { error: 'Unauthorized - No valid session found' },
      { status: 401 }
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}; 