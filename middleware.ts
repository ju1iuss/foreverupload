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
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  console.log(`Middleware: ${request.nextUrl.pathname} - User: ${user?.email || 'none'}`);

  const host = request.headers.get('host')?.trim();
  const protocol = (request.headers.get('x-forwarded-proto') || 'http').trim();
  // In dev, always use localhost if host is localhost
  const siteUrl = (host?.includes('localhost') || host?.includes('127.0.0.1')) 
    ? `${protocol}://${host}`.trim()
    : (process.env.NEXT_PUBLIC_SITE_URL?.trim() || `${protocol}://${host}`.trim());

  const isAuthPage = request.nextUrl.pathname === '/auth';
  const isLandingPage = request.nextUrl.pathname === '/';
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/calendar') || 
                          request.nextUrl.pathname.startsWith('/upload') ||
                          request.nextUrl.pathname.startsWith('/settings');

  if (user) {
    if (isAuthPage || isLandingPage) {
      return NextResponse.redirect(new URL('/dashboard', siteUrl));
    }
  } else {
    if (isProtectedRoute) {
      return NextResponse.redirect(new URL('/auth', siteUrl));
    }
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
