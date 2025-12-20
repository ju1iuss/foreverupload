import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  const type = searchParams.get('type') as EmailOtpType | null;
  const email = searchParams.get('email');
  const next = searchParams.get('next') ?? '/dashboard';

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error('NEXT_PUBLIC_SITE_URL environment variable is required');
  }

  const redirectTo = new URL(next, siteUrl);
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('token');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('next');

  // Create response first to set cookies
  const response = NextResponse.redirect(redirectTo);

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // PKCE flow: exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return response;
    }
    
    console.error('Code exchange error:', error);
  }

  // Try token_hash verification
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return response;
    }
    
    console.error('Token hash verification error:', error);
  }

  // Fallback: try token (requires email for EmailOtpType)
  if (token && type && email) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token,
      email,
    });

    if (!error) {
      return response;
    }
    
    console.error('Token verification error:', error);
  }

  // Error: redirect to auth with error message
  const errorRedirect = new URL('/auth', siteUrl);
  errorRedirect.searchParams.set('error', 'Invalid or expired confirmation link. Please try signing up again.');
  return NextResponse.redirect(errorRedirect);
}

