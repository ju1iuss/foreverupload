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

    const sandboxToken = process.env.PINTEREST_SANDBOX_TOKEN;

    // Return authenticated: true ONLY if they have their own token
    // sandboxToken is just a fallback for the API, not for the session status
    return NextResponse.json({
      authenticated: !!authData?.access_token,
      username: authData?.pinterest_username || (sandboxToken ? 'Sandbox User' : null),
      profileImage: authData?.pinterest_profile_image || null,
      isSandbox: !authData?.access_token && !!sandboxToken,
      sandboxAvailable: !!sandboxToken
    });
  } catch (error) {
    console.error('Error in /api/pinterest/user:', error);
    return NextResponse.json({ error: 'Internal server error', authenticated: false }, { status: 500 });
  }
}

