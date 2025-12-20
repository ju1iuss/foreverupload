import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const clientId = process.env.PINTEREST_CLIENT_ID;
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
  const redirectUri = process.env.PINTEREST_REDIRECT_URI || `${siteUrl}/api/auth/pinterest/callback`;
  // For Pinterest V5, scopes should be comma-separated. 
  // Added 'user_accounts:read' to get user info and 'refresh_token' to get a refresh token.
  const scopes = 'boards:read,boards:write,pins:read,pins:write,user_accounts:read';

  const authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&state=${user.id}`;

  return NextResponse.redirect(authUrl);
}

