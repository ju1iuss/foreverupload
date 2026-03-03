import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized', authenticated: false }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase
      .from('pin_auth')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      authenticated: !!authData?.access_token,
      username: authData?.pinterest_username || null,
      profileImage: authData?.pinterest_profile_image || null,
    });
  } catch (error) {
    console.error('Error in /api/pinterest/user:', error);
    return NextResponse.json({ error: 'Internal server error', authenticated: false }, { status: 500 });
  }
}

