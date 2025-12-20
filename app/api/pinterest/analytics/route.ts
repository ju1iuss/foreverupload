import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

async function refreshAccessToken(refreshToken: string, userId: string, supabase: any) {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  const clientSecret = process.env.PINTEREST_CLIENT_SECRET;

  try {
    const response = await fetch('https://api-sandbox.pinterest.com/v5/oauth/token', {
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

function getDateToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

export async function GET(request: NextRequest) {
  try {
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

    const sandboxToken = process.env.PINTEREST_SANDBOX_TOKEN;

    if (!authData && !sandboxToken) {
      return NextResponse.json({ error: 'Not connected' }, { status: 401 });
    }

    let accessToken = authData?.access_token || sandboxToken;
    
    // Refresh token if needed (only if using database auth)
    if (authData && new Date(authData.expires_at) <= new Date()) {
      const refreshed = await refreshAccessToken(authData.refresh_token, user.id, supabase);
      if (refreshed) accessToken = refreshed;
    }

    if (!accessToken) {
      return NextResponse.json({ error: 'Token not available' }, { status: 401 });
    }

    const { data: postedPins } = await supabase
      .from('pin_scheduled')
      .select('id, pin_id, title, posted_at, image_url')
      .eq('user_id', user.id)
      .eq('status', 'posted')
      .not('pin_id', 'is', null)
      .order('posted_at', { ascending: false })
      .limit(100);

    if (!postedPins || postedPins.length === 0) {
      return NextResponse.json({ pins: [], totalImpressions: 0, totalSaves: 0, totalClicks: 0 });
    }

    const pinsWithAnalytics = await Promise.all(
      postedPins.map(async (pin: any) => {
        try {
          // Determine base URL (try production first, then sandbox if token exchange was sandbox)
          // We'll try production and fallback to sandbox if it fails
          const getPinAnalytics = async (baseUrl: string) => {
            return fetch(
              `${baseUrl}/v5/pins/${pin.pin_id}/analytics?start_date=${getDateDaysAgo(90)}&end_date=${getDateToday()}&metric_types=IMPRESSION,SAVE,CLICKTHROUGH`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );
          };

          // Try production first, then fallback to sandbox
          let response = await getPinAnalytics('https://api.pinterest.com');
          
          if (!response.ok) {
            response = await getPinAnalytics('https://api-sandbox.pinterest.com');
          }

          if (!response.ok) return { ...pin, impressions: 0, saves: 0, clicks: 0, dailyMetrics: [] };
          const data = await response.json();
          
          let impressions = 0, saves = 0, clicks = 0;
          const dailyMetrics: any[] = [];
          
          if (data.daily_metrics) {
            data.daily_metrics.forEach((day: any) => {
              const dayImpressions = parseInt(day.IMPRESSION) || 0;
              const daySaves = parseInt(day.SAVE) || 0;
              const dayClicks = parseInt(day.CLICKTHROUGH) || 0;
              
              impressions += dayImpressions;
              saves += daySaves;
              clicks += dayClicks;
              
              if (day.date) {
                dailyMetrics.push({
                  date: day.date,
                  impressions: dayImpressions,
                  saves: daySaves,
                  clicks: dayClicks,
                });
              }
            });
          } else if (data.all) {
            impressions = parseInt(data.all.IMPRESSION) || 0;
            saves = parseInt(data.all.SAVE) || 0;
            clicks = parseInt(data.all.CLICKTHROUGH) || 0;
          }
          return { ...pin, impressions, saves, clicks, dailyMetrics };
        } catch (err) {
          return { ...pin, impressions: 0, saves: 0, clicks: 0, dailyMetrics: [] };
        }
      })
    );

    const totalImpressions = pinsWithAnalytics.reduce((sum, pin) => sum + pin.impressions, 0);
    const totalSaves = pinsWithAnalytics.reduce((sum, pin) => sum + pin.saves, 0);
    const totalClicks = pinsWithAnalytics.reduce((sum, pin) => sum + pin.clicks, 0);

    // Aggregate daily metrics across all pins
    const dailyMetricsMap = new Map<string, { impressions: number; saves: number; clicks: number }>();
    
    pinsWithAnalytics.forEach((pin: any) => {
      if (pin.dailyMetrics && Array.isArray(pin.dailyMetrics)) {
        pin.dailyMetrics.forEach((day: any) => {
          const existing = dailyMetricsMap.get(day.date) || { impressions: 0, saves: 0, clicks: 0 };
          dailyMetricsMap.set(day.date, {
            impressions: existing.impressions + day.impressions,
            saves: existing.saves + day.saves,
            clicks: existing.clicks + day.clicks,
          });
        });
      }
    });

    // Convert to array and sort by date
    const dailyMetrics = Array.from(dailyMetricsMap.entries())
      .map(([date, metrics]) => ({ date, ...metrics }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ 
      pins: pinsWithAnalytics, 
      totalImpressions, 
      totalSaves, 
      totalClicks,
      dailyMetrics 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

