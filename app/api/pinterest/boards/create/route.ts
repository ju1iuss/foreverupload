import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { name, description, privacy } = await request.json();
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Board name is required' }, { status: 400 });
    }

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

    const accessToken = authData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: 'Token not available' }, { status: 401 });
    }

    // Create board
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
      return NextResponse.json({ error: 'Failed to create board', details: errorText }, { status: response.status });
    }

    const boardData = await response.json();
    return NextResponse.json({ success: true, board: boardData });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

