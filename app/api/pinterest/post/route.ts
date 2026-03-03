import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

async function refreshAccessToken(refreshToken: string, userId: string, supabase: any) {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

  const tryRefresh = async (url: string) => {
    return fetch(url, {
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
  };

  try {
    const response = await tryRefresh('https://api.pinterest.com/v5/oauth/token');

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

async function fetchImageAsBase64(imageUrl: string) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return {
      base64: Buffer.from(arrayBuffer).toString('base64'),
      contentType
    };
  } catch (error) {
    console.error('Image fetch error:', error);
    return null;
  }
}

async function createPin(accessToken: string, pin: any, imageData: { base64: string, contentType: string }) {
  const body: any = {
    board_id: pin.board_id,
    media_source: { 
      source_type: 'image_base64', 
      content_type: imageData.contentType, 
      data: imageData.base64 
    },
    title: pin.title || '',
    description: pin.description || '',
  };
  
  if (pin.link) {
    body.link = pin.link;
  }
  
  const response = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) return { success: false, error: await response.text() };
  const data = await response.json();
  return { success: true, pinId: data.id };
}

export async function POST(request: NextRequest) {
  try {
    const { pin_id } = await request.json();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { data: pin } = await supabase
      .from('pin_scheduled')
      .select('*')
      .eq('id', pin_id)
      .eq('user_id', user.id)
      .single();

    if (!pin || pin.status === 'posted') {
      return NextResponse.json({ error: 'Pin not found or already posted' }, { status: 404 });
    }

    const imageData = await fetchImageAsBase64(pin.image_url);
    if (!imageData) {
      await supabase.from('pin_scheduled').update({ 
        status: 'failed',
        error_message: 'Failed to fetch image from URL'
      }).eq('id', pin.id);
      return NextResponse.json({ error: 'Image fetch failed' }, { status: 500 });
    }

    const result = await createPin(accessToken, pin, imageData);
    if (result.success) {
      await supabase.from('pin_scheduled').update({
        status: 'posted',
        posted_at: new Date().toISOString(),
        pin_id: result.pinId,
        error_message: null, // Clear any previous error
      }).eq('id', pin.id);
      return NextResponse.json({ success: true, pinId: result.pinId });
    } else {
      await supabase.from('pin_scheduled').update({ 
        status: 'failed',
        error_message: result.error || 'Failed to create pin on Pinterest'
      }).eq('id', pin.id);
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

