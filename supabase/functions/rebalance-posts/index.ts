import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting post rebalancing...')
    
    // Get all pending posts ordered by scheduled_at
    const { data: allPosts, error: fetchError } = await supabase
      .from('pin_scheduled')
      .select('*')
      .eq('status', 'pending')
      .not('scheduled_at', 'is', null)
      .order('scheduled_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching posts:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Database error', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!allPosts || allPosts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No posts to rebalance', updated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Group posts by user
    const postsByUser = new Map<string, typeof allPosts>()
    for (const post of allPosts) {
      const userId = post.user_id
      if (!postsByUser.has(userId)) {
        postsByUser.set(userId, [])
      }
      postsByUser.get(userId)!.push(post)
    }

    const updates = []
    const DAILY_LIMIT = 6
    const CRON_HOURS = [8, 9, 10, 11, 12, 13]

    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    for (const [userId, userPosts] of postsByUser) {
      console.log(`Rebalancing ${userPosts.length} posts for user ${userId}`)
      
      // Sort posts by scheduled_at
      const sortedPosts = userPosts.sort((a, b) => 
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
      )

      // Count posts already posted today
      const { count: postedToday } = await supabase
        .from('pin_scheduled')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gte('posted_at', today.toISOString())

      const userPostsPerDay = new Map<string, number>()
      userPostsPerDay.set(todayStr, postedToday || 0)

      for (const post of sortedPosts) {
        // Find next available day with less than 6 posts
        let currentDay = new Date(today)
        let positionInDay = 0
        
        for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
          const checkDate = new Date(today)
          checkDate.setDate(today.getDate() + dayOffset)
          const dateKey = checkDate.toISOString().split('T')[0]
          const postsOnDay = userPostsPerDay.get(dateKey) || 0
          
          if (postsOnDay < DAILY_LIMIT) {
            // For today, make sure we don't schedule in the past
            if (dayOffset === 0) {
              const currentHour = now.getHours()
              const startHour = Math.max(8, currentHour + 1)
              if (startHour + (postsOnDay - (postedToday || 0)) >= 14) {
                // Too late today (last slot is 13), skip to tomorrow
                continue
              }
              currentDay = checkDate
              positionInDay = postsOnDay
              userPostsPerDay.set(dateKey, postsOnDay + 1)
              break
            }

            currentDay = checkDate
            positionInDay = postsOnDay
            userPostsPerDay.set(dateKey, postsOnDay + 1)
            break
          }
        }
        
        // Set time based on position (hours 8-13)
        const hour = CRON_HOURS[Math.min(positionInDay, 5)] ?? 8
        currentDay.setHours(hour, 0, 0, 0)
        
        // Only update if the scheduled time has changed
        const newScheduledAt = currentDay.toISOString()
        if (post.scheduled_at !== newScheduledAt) {
          updates.push({
            id: post.id,
            old_scheduled_at: post.scheduled_at,
            new_scheduled_at: newScheduledAt,
          })
          
          await supabase
            .from('pin_scheduled')
            .update({ scheduled_at: newScheduledAt })
            .eq('id', post.id)
        }
      }
    }

    console.log(`Rebalancing complete. Updated ${updates.length} posts.`)

    return new Response(
      JSON.stringify({
        message: 'Rebalancing complete',
        updated: updates.length,
        details: updates.slice(0, 10), // Show first 10 updates
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: any) {
    console.error('Error rebalancing posts:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

