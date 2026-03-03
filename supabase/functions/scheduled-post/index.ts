import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { encodeBase64 } from 'https://deno.land/std@0.207.0/encoding/base64.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function refreshAccessToken(refreshToken: string, userId: string, supabase: any) {
  const clientId = Deno.env.get('PINTEREST_CLIENT_ID')
  const clientSecret = Deno.env.get('PINTEREST_CLIENT_SECRET')

  if (!clientId || !clientSecret) {
    console.error('Missing Pinterest client configuration in environment variables')
    return null
  }

  try {
    const response = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Token refresh failed with status ${response.status}: ${errorText}`)
      return null
    }
    const data = await response.json()
    
    await supabase
    .from('pin_auth')
    .update({ 
      access_token: data.access_token, 
      expires_at: new Date(Date.now() + (data.expires_in * 1000)).toISOString(),
      updated_at: new Date().toISOString() 
    })
    .eq('user_id', userId)

    return data.access_token
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

async function fetchImageAsBase64(imageUrl: string) {
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`)
      return null
    }
    const arrayBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    return {
      base64: encodeBase64(arrayBuffer),
      contentType
    }
  } catch (error) {
    console.error('Image fetch error:', error)
    return null
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
  }
  
  if (pin.link) {
    body.link = pin.link
  }
  
  const response = await fetch('https://api.pinterest.com/v5/pins', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    return { success: false, error }
  }
  const data = await response.json()
  return { success: true, pinId: data.id }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    console.log('Running scheduled post check at:', now.toISOString())
    
    // Get all pending pins that are scheduled to be posted now or in the past
    const { data: allPins, error: fetchError } = await supabase
      .from('pin_scheduled')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true, nullsFirst: false })
      .limit(50)

    if (fetchError) {
      console.error('Error fetching scheduled pins:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Filter pins where scheduled_at <= now (or created_at if scheduled_at is null)
    const scheduledPins = (allPins || []).filter((pin: any) => {
      const scheduleTime = pin.scheduled_at || pin.created_at
      return new Date(scheduleTime) <= now
    }).slice(0, 10) // Limit to 10 per run

    if (!scheduledPins || scheduledPins.length === 0) {
      console.log('No scheduled posts to process')
      return new Response(
        JSON.stringify({ message: 'No scheduled posts to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing ${scheduledPins.length} scheduled pins`)

    const results = []
    const DAILY_LIMIT = 6

    // Group pins by user to check daily limits per user
    const pinsByUser = new Map<string, typeof scheduledPins>()
    for (const pin of scheduledPins) {
      const userId = pin.user_id
      if (!pinsByUser.has(userId)) {
        pinsByUser.set(userId, [])
      }
      pinsByUser.get(userId)!.push(pin)
    }

    for (const [userId, userPins] of pinsByUser) {
      console.log(`Processing ${userPins.length} pins for user ${userId}`)
      
      // Check how many posts this user has posted today
      const todayStart = new Date(now)
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date(now)
      todayEnd.setHours(23, 59, 59, 999)

      const { count: postedToday } = await supabase
        .from('pin_scheduled')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gte('posted_at', todayStart.toISOString())
        .lte('posted_at', todayEnd.toISOString())

      const remainingSlots = Math.max(0, DAILY_LIMIT - (postedToday || 0))
      console.log(`User ${userId} has ${remainingSlots} remaining slots today`)
      
      const pinsToProcess = userPins.slice(0, remainingSlots)

      if (pinsToProcess.length === 0) {
        for (const pin of userPins) {
          results.push({
            pinId: pin.id,
            status: 'skipped',
            reason: 'Daily limit reached',
          })
        }
        continue
      }

      // Get auth for this user
      const { data: authData, error: authError } = await supabase
        .from('pin_auth')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (authError || !authData) {
        console.error(`No auth found for user ${userId}`)
        for (const pin of userPins) {
          results.push({
            pinId: pin.id,
            status: 'failed',
            error: 'No authentication found',
          })
          await supabase
            .from('pin_scheduled')
            .update({ 
              status: 'failed',
              error_message: 'Pinterest account not connected or authentication expired'
            })
            .eq('id', pin.id)
        }
        continue
      }

      let accessToken = authData.access_token
      
      // Refresh token if needed
      if (new Date(authData.expires_at) <= now) {
        console.log(`Refreshing token for user ${userId}`)
        const refreshed = await refreshAccessToken(authData.refresh_token, userId, supabase)
        if (refreshed) {
          accessToken = refreshed
        } else {
          console.error(`Token refresh failed for user ${userId}`)
          for (const pin of userPins) {
            results.push({
              pinId: pin.id,
              status: 'failed',
              error: 'Token refresh failed',
            })
            await supabase
              .from('pin_scheduled')
              .update({ 
                status: 'failed',
                error_message: 'Pinterest authentication token expired and could not be refreshed. Please reconnect your account.'
              })
              .eq('id', pin.id)
          }
          continue
        }
      }

      // Process each pin
      for (const pin of pinsToProcess) {
        console.log(`Processing pin ${pin.id}`)
        try {
          const imageData = await fetchImageAsBase64(pin.image_url)
          if (!imageData) {
            console.error(`Image fetch failed for pin ${pin.id}`)
            results.push({
              pinId: pin.id,
              status: 'failed',
              error: 'Image fetch failed',
            })
            await supabase
              .from('pin_scheduled')
              .update({ 
                status: 'failed',
                error_message: 'Failed to fetch image from URL'
              })
              .eq('id', pin.id)
            continue
          }

          const result = await createPin(accessToken, pin, imageData)
          if (result.success) {
            console.log(`Successfully posted pin ${pin.id} as ${result.pinId}`)
            await supabase
              .from('pin_scheduled')
              .update({
                status: 'posted',
                posted_at: new Date().toISOString(),
                pin_id: result.pinId,
                error_message: null, // Clear any previous error
              })
              .eq('id', pin.id)
            
            results.push({
              pinId: pin.id,
              status: 'posted',
              pinterestPinId: result.pinId,
            })
          } else {
            console.error(`Failed to post pin ${pin.id}:`, result.error)
            results.push({
              pinId: pin.id,
              status: 'failed',
              error: result.error,
            })
            await supabase
              .from('pin_scheduled')
              .update({ 
                status: 'failed',
                error_message: result.error || 'Failed to create pin on Pinterest'
              })
              .eq('id', pin.id)
          }
        } catch (error: any) {
          console.error(`Error processing pin ${pin.id}:`, error)
          results.push({
            pinId: pin.id,
            status: 'failed',
            error: error.message || 'Unknown error',
          })
          await supabase
            .from('pin_scheduled')
            .update({ 
              status: 'failed',
              error_message: error.message || 'Unknown error occurred during posting'
            })
            .eq('id', pin.id)
        }
      }
    }

    console.log(`Completed processing. Results:`, results)

    return new Response(
      JSON.stringify({
        message: 'Processing complete',
        processed: results.length,
        results,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error processing scheduled posts:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

