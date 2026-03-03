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
      body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    await supabase
      .from('pin_auth')
      .update({
        access_token: data.access_token,
        expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    return data.access_token;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, privacy } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', code: 'no_session' }, { status: 401 });
    }

    const { data: authData } = await supabase
      .from('pin_auth')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!authData) {
      return NextResponse.json({ error: 'Pinterest not connected', code: 'not_connected' }, { status: 401 });
    }

    let accessToken = authData.access_token;

    // Refresh token if expired
    if (new Date(authData.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(authData.refresh_token, user.id, supabase);
      if (refreshed) {
        accessToken = refreshed;
      } else {
        return NextResponse.json({ error: 'Pinterest token expired. Please reconnect your account.', code: 'token_expired' }, { status: 401 });
      }
    }

    const response = await fetch('https://api.pinterest.com/v5/boards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        name: name.trim(),
        description: description || '',
        privacy: privacy || 'PUBLIC',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      // If Pinterest returns 401, the token is invalid – prompt reconnect
      if (response.status === 401) {
        return NextResponse.json({ error: 'Pinterest token invalid. Please reconnect your account.', code: 'token_expired' }, { status: 401 });
      }
      return NextResponse.json({ error: 'Failed to create board', details: errorText }, { status: response.status });
    }

    const boardData = await response.json();
    return NextResponse.json({ success: true, board: boardData });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

