import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

async function refreshAccessToken(refreshToken: string, userId: string, supabase: any) {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

  try {
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    
    await supabase
      .from('pin_auth')
      .update({ 
        access_token: data.access_token, 
        expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    return data.access_token;
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pinterest Compliance: We only store access tokens, not board data
    // Board information is fetched fresh from Pinterest API each time
    const { data: authData } = await supabase
      .from('pin_auth')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!authData) {
      return NextResponse.json({ error: 'Not connected' }, { status: 401 });
    }

    let accessToken = authData.access_token;
    
    // Refresh token if needed (only if using database auth)
    if (authData && new Date(authData.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(authData.refresh_token, user.id, supabase);
      if (refreshed) accessToken = refreshed;
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Token not available' }, { status: 401 });
    }

    const boardsEndpoint = 'https://api.pinterest.com/v5/boards?page_size=250';

    const boardsResponse = await fetch(boardsEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!boardsResponse.ok) {
      const errorText = await boardsResponse.text();
      return NextResponse.json({ error: 'Failed to fetch boards', details: errorText }, { status: boardsResponse.status });
    }

    const boardsData = await boardsResponse.json();
    console.log(`Fetched ${boardsData.items?.length || 0} boards from ${boardsResponse.url}`);
    
    if (boardsData.items && boardsData.items.length > 0) {
      console.log('First board:', boardsData.items[0]);
    }

    return NextResponse.json({ items: boardsData.items || [] });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

