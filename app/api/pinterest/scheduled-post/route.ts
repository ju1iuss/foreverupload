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

// This endpoint processes all scheduled posts that are due
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const now = new Date();
    
    // Get all pending pins that are scheduled to be posted now or in the past
    // If scheduled_at is null, use created_at as fallback for backward compatibility
    const { data: allPins, error: fetchError } = await supabase
      .from('pin_scheduled')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .limit(50); // Process max 50 at a time to avoid rate limits

    if (fetchError) {
      console.error('Error fetching scheduled pins:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Filter pins where scheduled_at <= now (or created_at if scheduled_at is null)
    const scheduledPins = (allPins || []).filter((pin: any) => {
      const scheduleTime = pin.scheduled_at || pin.created_at;
      return new Date(scheduleTime) <= now;
    }).slice(0, 10); // Limit to 10 per run

    if (fetchError) {
      console.error('Error fetching scheduled pins:', fetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!scheduledPins || scheduledPins.length === 0) {
      return NextResponse.json({ 
        message: 'No scheduled posts to process',
        processed: 0 
      });
    }

    const results: { pinId: string; status: string; reason?: string; error?: string; pinterestPinId?: string }[] = [];
    const DAILY_LIMIT = 6; // Pinterest daily limit

    // Group pins by user to check daily limits per user
    const pinsByUser = new Map<string, typeof scheduledPins>();
    for (const pin of scheduledPins) {
      const userId = pin.user_id;
      if (!pinsByUser.has(userId)) {
        pinsByUser.set(userId, []);
      }
      pinsByUser.get(userId)!.push(pin);
    }

    const pinsByUserPromises: Promise<void>[] = [];
    
    pinsByUser.forEach((userPins, userId) => {
      pinsByUserPromises.push((async () => {
        // Check how many posts this user has posted today
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        const { count: postedToday } = await supabase
          .from('pin_scheduled')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'posted')
          .gte('posted_at', todayStart.toISOString())
          .lte('posted_at', todayEnd.toISOString());

        const remainingSlots = Math.max(0, DAILY_LIMIT - (postedToday || 0));
        const pinsToProcess = userPins.slice(0, remainingSlots);

        if (pinsToProcess.length === 0) {
          // Skip this user - daily limit reached
          for (const pin of userPins) {
            results.push({
              pinId: pin.id,
              status: 'skipped',
              reason: 'Daily limit reached',
            });
          }
          return;
        }

        // Get auth for this user
        const { data: authData, error: authError } = await supabase
          .from('pin_auth')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (authError || !authData) {
          for (const pin of userPins) {
            results.push({
              pinId: pin.id,
              status: 'failed',
              error: 'No authentication found',
            });
            await supabase
              .from('pin_scheduled')
              .update({ status: 'failed' })
              .eq('id', pin.id);
          }
          return;
        }

        let accessToken = authData.access_token;
        
        // Refresh token if needed
        if (new Date(authData.expires_at) <= now) {
          const refreshed = await refreshAccessToken(authData.refresh_token, userId, supabase);
          if (refreshed) {
            accessToken = refreshed;
          } else {
            for (const pin of userPins) {
              results.push({
                pinId: pin.id,
                status: 'failed',
                error: 'Token refresh failed',
              });
              await supabase
                .from('pin_scheduled')
                .update({ status: 'failed' })
                .eq('id', pin.id);
            }
            return;
          }
        }

        // Process each pin
        for (const pin of pinsToProcess) {
          try {
            const imageData = await fetchImageAsBase64(pin.image_url);
            if (!imageData) {
              results.push({
                pinId: pin.id,
                status: 'failed',
                error: 'Image fetch failed',
              });
              await supabase
                .from('pin_scheduled')
                .update({ 
                  status: 'failed',
                  error_message: 'Failed to fetch image from URL'
                })
                .eq('id', pin.id);
              continue;
            }

            const result = await createPin(accessToken, pin, imageData);
            if (result.success) {
              await supabase
                .from('pin_scheduled')
                .update({
                  status: 'posted',
                  posted_at: new Date().toISOString(),
                  pin_id: result.pinId,
                  error_message: null, // Clear any previous error
                })
                .eq('id', pin.id);
              
              results.push({
                pinId: pin.id,
                status: 'posted',
                pinterestPinId: result.pinId,
              });
            } else {
              console.error(`Pinterest API error for pin ${pin.id}:`, result.error);
              results.push({
                pinId: pin.id,
                status: 'failed',
                error: result.error,
              });
              await supabase
                .from('pin_scheduled')
                .update({ 
                  status: 'failed',
                  error_message: result.error || 'Failed to create pin on Pinterest'
                })
                .eq('id', pin.id);
            }
          } catch (error: any) {
            console.error(`Error processing pin ${pin.id}:`, error);
            results.push({
              pinId: pin.id,
              status: 'failed',
              error: error.message || 'Unknown error',
            });
            await supabase
              .from('pin_scheduled')
              .update({ 
                status: 'failed',
                error_message: error.message || 'Unknown error occurred during posting'
              })
              .eq('id', pin.id);
          }
        }
      })());
    });

    await Promise.all(pinsByUserPromises);

    return NextResponse.json({
      message: 'Processing complete',
      processed: results.length,
      results,
    });
  } catch (error: any) {
    console.error('Error processing scheduled posts:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

