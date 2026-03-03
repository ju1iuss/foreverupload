import { createAdminClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

// Protected by CRON_SECRET - must match the Authorization header
// Set CRON_SECRET in your environment variables
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Fetch ALL pending pins (including those with null scheduled_at)
    const { data: allPosts, error: fetchError } = await supabase
      .from('pin_scheduled')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true, nullsFirst: false });

    if (fetchError) {
      console.error('Error fetching posts:', fetchError);
      return NextResponse.json({ error: 'Database error', details: fetchError.message }, { status: 500 });
    }

    if (!allPosts || allPosts.length === 0) {
      return NextResponse.json({ message: 'No posts to rebalance', updated: 0 });
    }

    // Group posts by user
    const postsByUser = new Map<string, typeof allPosts>();
    for (const post of allPosts) {
      const userId = post.user_id;
      if (!postsByUser.has(userId)) postsByUser.set(userId, []);
      postsByUser.get(userId)!.push(post);
    }

    const updates: { id: string; old_scheduled_at: string; new_scheduled_at: string }[] = [];
    const DAILY_LIMIT = 6;
    const CRON_HOURS = [8, 9, 10, 11, 12, 13];

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    for (const [userId, userPosts] of Array.from(postsByUser)) {
      // Pins without scheduled_at sort last (they're the oldest/unscheduled)
      const sortedPosts = [...userPosts].sort((a, b) => {
        const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : new Date(a.created_at).getTime();
        const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : new Date(b.created_at).getTime();
        return aTime - bTime;
      });

      const { count: postedToday } = await supabase
        .from('pin_scheduled')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'posted')
        .gte('posted_at', today.toISOString());

      const userPostsPerDay = new Map<string, number>();
      userPostsPerDay.set(todayStr, postedToday || 0);

      for (const post of sortedPosts) {
        let currentDay = new Date(today);
        let positionInDay = 0;

        for (let dayOffset = 0; dayOffset < 365; dayOffset++) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + dayOffset);
          const dateKey = checkDate.toISOString().split('T')[0];
          const postsOnDay = userPostsPerDay.get(dateKey) || 0;

          if (postsOnDay < DAILY_LIMIT) {
            if (dayOffset === 0) {
              const startHour = Math.max(8, now.getHours() + 1);
              if (startHour + (postsOnDay - (postedToday || 0)) >= 14) {
                continue;
              }
            }
            currentDay = checkDate;
            positionInDay = postsOnDay;
            userPostsPerDay.set(dateKey, postsOnDay + 1);
            break;
          }
        }

        const hour = CRON_HOURS[Math.min(positionInDay, 5)] ?? 8;
        currentDay.setHours(hour, 0, 0, 0);

        const newScheduledAt = currentDay.toISOString();
        // Always update if scheduled_at is null, or if the time has changed
        if (!post.scheduled_at || post.scheduled_at !== newScheduledAt) {
          updates.push({ id: post.id, old_scheduled_at: post.scheduled_at, new_scheduled_at: newScheduledAt });
          await supabase.from('pin_scheduled').update({ scheduled_at: newScheduledAt }).eq('id', post.id);
        }
      }
    }

    console.log(`Rebalancing complete. Updated ${updates.length} posts.`);
    return NextResponse.json({
      message: 'Rebalancing complete',
      updated: updates.length,
      details: updates.slice(0, 10),
    });
  } catch (error: any) {
    console.error('Error rebalancing posts:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
