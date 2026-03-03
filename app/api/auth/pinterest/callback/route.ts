import { createClient, createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state'); // user_id
  const error = searchParams.get('error');

  const host = request.headers.get('host')?.trim();
  const protocol = (request.headers.get('x-forwarded-proto') || 'http').trim();
  // In dev, always use localhost if host is localhost
  const frontendUrl = (host?.includes('localhost') || host?.includes('127.0.0.1')) 
    ? `${protocol}://${host}`.trim()
    : (process.env.NEXT_PUBLIC_SITE_URL?.trim() || `${protocol}://${host}`.trim());

  if (error) {
    return NextResponse.redirect(`${frontendUrl}/auth?error=${error}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${frontendUrl}/auth?error=missing_parameters`);
  }

  try {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    const redirectUri = process.env.PINTEREST_REDIRECT_URI || `${frontendUrl}/api/auth/pinterest/callback`;

    // Diagnostic check: common mistake is to put an access token (pina_...) in the client secret field
    if (clientSecret?.startsWith('pina_')) {
      console.error('CRITICAL: PINTEREST_CLIENT_SECRET appears to be an access token (starts with pina_). Please check your .env file and use the Client Secret from the Pinterest App dashboard.');
      return NextResponse.redirect(`${frontendUrl}/auth?error=invalid_client_secret_format`);
    }

    console.log('Exchanging code for tokens with redirect_uri:', redirectUri);

    // Prepare headers for Basic Auth as per Pinterest V5 documentation
    const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;

    // Prepare body exactly as per Pinterest documentation
    const bodyParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code || '',
      redirect_uri: redirectUri,
    });
    
    // Add continuous_refresh for older apps or to be safe (ignored by newer apps)
    bodyParams.append('continuous_refresh', 'true');

    // Exchange code for tokens
    const tokenResponse = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': authHeader,
      },
      body: bodyParams,
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed (all endpoints):', errorText);
      return NextResponse.redirect(`${frontendUrl}/auth?error=token_exchange_failed&details=${encodeURIComponent(errorText)}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));

    // Fetch user info from Pinterest
    const userEndpoint = 'https://api.pinterest.com/v5/user_account';

    const userResponse = await fetch(userEndpoint, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    let userData = null;
    if (userResponse.ok) {
      userData = await userResponse.json();
    }

    const supabase = await createClient();
    
    // Verify user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Use state as backup if session is missing in callback context
    const userId = user?.id || state;

    if (!userId) {
      console.error('No user ID found in session or state');
      return NextResponse.redirect(`${frontendUrl}/auth?error=no_user_id`);
    }

    // Store tokens and user info in database using Admin client to bypass RLS issues in callback
    const adminSupabase = createAdminClient();
    
    const authData = {
      user_id: userId,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt.toISOString(),
      pinterest_username: userData?.username || null,
      pinterest_profile_image: userData?.profile_image || null,
      pinterest_user_id: userData?.id || null,
      updated_at: new Date().toISOString(),
    };

    console.log('Attempting to save Pinterest auth for user:', userId);

    const { error: dbError } = await adminSupabase
      .from('pin_auth')
      .upsert(authData, { onConflict: 'user_id' });

    if (dbError) {
      console.error('Database error saving Pinterest auth:', dbError);
      return NextResponse.redirect(`${frontendUrl}/auth?error=db_error&details=${encodeURIComponent(dbError.message)}`);
    }

    console.log('Successfully saved Pinterest auth for user:', userId);
    return NextResponse.redirect(`${frontendUrl}/dashboard?connected=true`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(`${frontendUrl}/auth?error=internal_server_error`);
  }
}

