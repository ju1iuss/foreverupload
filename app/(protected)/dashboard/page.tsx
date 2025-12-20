'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PinAnalytics {
  id: string;
  pin_id: string;
  title: string | null;
  posted_at: string | null;
  image_url: string;
  impressions: number;
  saves: number;
  clicks: number;
}

interface DailyMetric {
  date: string;
  impressions: number;
  saves: number;
  clicks: number;
}

interface DailyPinCount {
  date: string;
  count: number;
}

interface DashboardMetrics {
  totalPins: number;
  postedPins: number;
  pendingPins: number;
  failedPins: number;
  createdToday: number;
  postedToday: number;
  totalImpressions: number;
  totalSaves: number;
  totalClicks: number;
  pins: PinAnalytics[];
  dailyMetrics: DailyMetric[];
  pinsPostedOverTime: DailyPinCount[];
  previousPeriod?: {
    impressions: number;
    saves: number;
    clicks: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get basic pin counts (fetch all to allow client-side filtering)
      const { data: allPins, error: pinsError } = await supabase
        .from('pin_scheduled')
        .select('status, created_at, posted_at')
        .eq('user_id', user.id);

      if (pinsError) throw pinsError;

      // Fetch analytics from API (fetches last 90 days)
      const analyticsResponse = await fetch('/api/pinterest/analytics');

      let analyticsData = {
        pins: [],
        totalImpressions: 0,
        totalSaves: 0,
        totalClicks: 0,
        dailyMetrics: [],
      };

      if (analyticsResponse.ok) {
        try {
          analyticsData = await analyticsResponse.json();
        } catch (parseError) {
          console.error('Error parsing analytics response:', parseError);
        }
      }

      // Calculate pins posted over time (last 90 days to cover all filters)
      const pinsPostedMap = new Map<string, number>();
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      ninetyDaysAgo.setHours(0, 0, 0, 0);
      
      allPins?.forEach((pin) => {
        if (pin.status === 'posted' && pin.posted_at) {
          const postedDate = new Date(pin.posted_at);
          if (postedDate >= ninetyDaysAgo) {
            const dateStr = postedDate.getFullYear() + '-' + 
                           String(postedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                           String(postedDate.getDate()).padStart(2, '0');
            pinsPostedMap.set(dateStr, (pinsPostedMap.get(dateStr) || 0) + 1);
          }
        }
      });

      const pinsPostedOverTime: DailyPinCount[] = [];
      for (let i = 89; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.getFullYear() + '-' + 
                       String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                       String(date.getDate()).padStart(2, '0');
        pinsPostedOverTime.push({
          date: dateStr,
          count: pinsPostedMap.get(dateStr) || 0,
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today);
      todayEnd.setHours(23, 59, 59, 999);
      
      const createdToday = allPins?.filter(
        (p) => p.created_at && new Date(p.created_at) >= today && new Date(p.created_at) <= todayEnd
      ).length || 0;

      const postedToday = allPins?.filter(
        (p) => p.status === 'posted' && p.posted_at && new Date(p.posted_at) >= today && new Date(p.posted_at) <= todayEnd
      ).length || 0;

      setMetrics({
        totalPins: allPins?.length || 0,
        postedPins: allPins?.filter((p) => p.status === 'posted').length || 0,
        pendingPins: allPins?.filter((p) => p.status === 'pending').length || 0,
        failedPins: allPins?.filter((p) => p.status === 'failed').length || 0,
        createdToday,
        postedToday,
        totalImpressions: analyticsData.totalImpressions || 0,
        totalSaves: analyticsData.totalSaves || 0,
        totalClicks: analyticsData.totalClicks || 0,
        pins: analyticsData.pins || [],
        dailyMetrics: analyticsData.dailyMetrics || [],
        pinsPostedOverTime,
        // Store all pins for filtering
        allPinsRaw: allPins,
      } as any);
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate filtered metrics based on current timeRange
  const getFilteredMetrics = () => {
    if (!metrics) return null;

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    cutoffDate.setHours(0, 0, 0, 0);

    const prevCutoffDate = new Date(cutoffDate);
    prevCutoffDate.setDate(prevCutoffDate.getDate() - days);

    // Filter daily metrics
    const filteredDailyMetrics = metrics.dailyMetrics.filter(m => new Date(m.date) >= cutoffDate);
    const prevDailyMetrics = metrics.dailyMetrics.filter(m => {
      const d = new Date(m.date);
      return d >= prevCutoffDate && d < cutoffDate;
    });

    const currentImpressions = filteredDailyMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const currentSaves = filteredDailyMetrics.reduce((sum, m) => sum + m.saves, 0);
    const currentClicks = filteredDailyMetrics.reduce((sum, m) => sum + m.clicks, 0);

    const prevImpressions = prevDailyMetrics.reduce((sum, m) => sum + m.impressions, 0);
    const prevSaves = prevDailyMetrics.reduce((sum, m) => sum + m.saves, 0);
    const prevClicks = prevDailyMetrics.reduce((sum, m) => sum + m.clicks, 0);

    // Filter pins posted over time for graph
    const filteredPinsPostedOverTime = metrics.pinsPostedOverTime.slice(-days);

    // Filter status counts based on the range (using created_at or posted_at)
    const allPins = (metrics as any).allPinsRaw || [];
    const pinsInRange = allPins.filter((p: any) => {
      const date = p.posted_at ? new Date(p.posted_at) : new Date(p.created_at);
      return date >= cutoffDate;
    });

    const totalCreated = pinsInRange.length;
    const posted = pinsInRange.filter((p: any) => p.status === 'posted').length;
    const pending = pinsInRange.filter((p: any) => p.status === 'pending').length;
    const failed = pinsInRange.filter((p: any) => p.status === 'failed').length;

    return {
      ...metrics,
      totalImpressions: currentImpressions,
      totalSaves: currentSaves,
      totalClicks: currentClicks,
      totalPins: totalCreated,
      postedPins: posted,
      pendingPins: pending,
      failedPins: failed,
      dailyMetrics: filteredDailyMetrics,
      pinsPostedOverTime: filteredPinsPostedOverTime,
      previousPeriod: {
        impressions: prevImpressions,
        saves: prevSaves,
        clicks: prevClicks,
      }
    };
  };

  const filteredMetrics = getFilteredMetrics();

  const calculateEngagementRate = (m = filteredMetrics) => {
    if (!m || m.totalImpressions === 0) return 0;
    return ((m.totalSaves + m.totalClicks) / m.totalImpressions * 100).toFixed(2);
  };

  const calculatePrevEngagementRate = () => {
    if (!filteredMetrics || !filteredMetrics.previousPeriod || filteredMetrics.previousPeriod.impressions === 0) return 0;
    const p = filteredMetrics.previousPeriod;
    return ((p.saves + p.clicks) / p.impressions * 100).toFixed(2);
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#d2ccc6' }}>
            Dashboard
          </h1>
          <p style={{ color: '#666', fontSize: '0.9375rem' }}>
            Analytics and metrics for your Pinterest posts
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div style={{ 
            display: 'flex', 
            background: '#1a1a1a', 
            borderRadius: '8px', 
            padding: '2px', 
            border: '1px solid #333',
          }}>
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: timeRange === range ? '#4A90E2' : 'transparent',
                  color: timeRange === range ? '#d2ccc6' : '#666',
                  transition: 'all 0.2s',
                }}
              >
                {range === '7d' ? 'Last Week' : range === '30d' ? 'Last 30 Days' : 'Last 90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!filteredMetrics ? (
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '4rem',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#666' }}>{loading ? 'Loading metrics...' : 'Unable to load metrics'}</p>
        </div>
      ) : (
        <>
          {/* Main Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <CompactMetricCard
              title="Impressions"
              value={formatNumber(filteredMetrics.totalImpressions)}
              previous={filteredMetrics.previousPeriod?.impressions || 0}
              color="#4A90E2"
            />
            <CompactMetricCard
              title="Saves"
              value={formatNumber(filteredMetrics.totalSaves)}
              previous={filteredMetrics.previousPeriod?.saves || 0}
              color="#4A90E2"
            />
            <CompactMetricCard
              title="Clicks"
              value={formatNumber(filteredMetrics.totalClicks)}
              previous={filteredMetrics.previousPeriod?.clicks || 0}
              color="#4A90E2"
            />
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Impressions, Saves, and Clicks Over Time */}
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Performance Over Time
              </h2>
              {filteredMetrics.dailyMetrics && filteredMetrics.dailyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={filteredMetrics.dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={formatNumber as any}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#252525', 
                        border: '1px solid #333', 
                        borderRadius: '6px',
                        color: '#d2ccc6',
                        fontSize: '12px'
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ color: '#999', fontSize: '11px', paddingTop: '10px' }}
                      iconType="circle"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="impressions" 
                      stroke="#4A90E2" 
                      strokeWidth={2}
                      dot={false}
                      name="Impressions"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="saves" 
                      stroke="#00D4FF" 
                      strokeWidth={2}
                      dot={false}
                      name="Saves"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="clicks" 
                      stroke="#00FF88" 
                      strokeWidth={2}
                      dot={false}
                      name="Clicks"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  No analytics data available
                </div>
              )}
            </div>

            {/* Pins Posted Over Time */}
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '1.5rem',
              }}
            >
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Posting Activity
              </h2>
              {filteredMetrics.pinsPostedOverTime && filteredMetrics.pinsPostedOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={filteredMetrics.pinsPostedOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      stroke="#666"
                      tick={{ fill: '#666', fontSize: 10 }}
                      allowDecimals={false}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: '#252525', 
                        border: '1px solid #333', 
                        borderRadius: '6px',
                        color: '#d2ccc6',
                        fontSize: '12px'
                      }}
                      labelFormatter={(value) => {
                        const date = new Date(value);
                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                      }}
                      formatter={(value: number | undefined) => [value ?? 0, 'Pins']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#4A90E2" 
                      strokeWidth={2}
                      dot={{ fill: '#4A90E2', r: 3 }}
                      name="Pins Posted"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                  No pins posted yet
                </div>
              )}
            </div>
          </div>

          {/* Status + Engagement Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <CompactMetricCard
              title="Total Created"
              value={filteredMetrics.totalPins}
              previous={0}
              color="#4A90E2"
            />
            <CompactMetricCard
              title="Posted"
              value={filteredMetrics.postedPins}
              previous={0}
              color="#4A90E2"
            />
            <CompactMetricCard
              title="Pending"
              value={filteredMetrics.pendingPins}
              previous={0}
              color="#4A90E2"
            />
            <CompactMetricCard
              title="Failed"
              value={filteredMetrics.failedPins}
              previous={0}
              color="#4A90E2"
            />
            <CompactMetricCard
              title="Engagement"
              value={`${calculateEngagementRate()}%`}
              previous={calculatePrevEngagementRate()}
              color="#4A90E2"
              isPercentage={true}
            />
          </div>

          {/* Latest Posts */}
          {filteredMetrics.pins.length > 0 && (
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#999', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Latest Posts
                </h2>
                <div style={{ fontSize: '0.75rem', color: '#666' }}>
                  {filteredMetrics.postedPins} posted • {filteredMetrics.pendingPins} pending • {filteredMetrics.createdToday} created today • {filteredMetrics.postedToday} posted today
                </div>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {filteredMetrics.pins
                  .sort((a, b) => {
                    const aDate = a.posted_at ? new Date(a.posted_at).getTime() : 0;
                    const bDate = b.posted_at ? new Date(b.posted_at).getTime() : 0;
                    return bDate - aDate;
                  })
                  .slice(0, 6)
                  .map((pin) => {
                    const interactions = (pin.saves || 0) + (pin.clicks || 0);
                    const engagementRate = pin.impressions > 0 
                      ? ((pin.saves + pin.clicks) / pin.impressions * 100).toFixed(1)
                      : '0';
                    const formatDate = (dateString: string | null) => {
                      if (!dateString) return '';
                      const date = new Date(dateString);
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      
                      const dateStr = date.toISOString().split('T')[0];
                      const todayStr = today.toISOString().split('T')[0];
                      const yesterdayStr = yesterday.toISOString().split('T')[0];
                      
                      if (dateStr === todayStr) return 'Today';
                      if (dateStr === yesterdayStr) return 'Yesterday';
                      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    };
                    return (
                      <div
                        key={pin.id}
                        style={{
                          display: 'flex',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          background: '#252525',
                          borderRadius: '6px',
                          border: '1px solid #2a2a2a',
                          transition: 'all 0.2s',
                          alignItems: 'center',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = '#333';
                          e.currentTarget.style.background = '#2a2a2a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = '#2a2a2a';
                          e.currentTarget.style.background = '#252525';
                        }}
                      >
                        <img
                          src={pin.image_url}
                          alt={pin.title || 'Pin'}
                          style={{
                            width: '48px',
                            height: '48px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#d2ccc6', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {pin.title || 'Untitled Pin'}
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem', color: '#666', flexWrap: 'wrap' }}>
                            <span>{formatNumber(pin.impressions || 0)} views</span>
                            <span style={{ color: '#4A90E2' }}>{formatNumber(pin.saves || 0)} saves</span>
                            <span style={{ color: '#4A90E2' }}>{formatNumber(pin.clicks || 0)} clicks</span>
                            <span style={{ color: '#4A90E2' }}>{engagementRate}% engagement</span>
                            {pin.posted_at && (
                              <span style={{ color: '#999' }}>{formatDate(pin.posted_at)}</span>
                            )}
                          </div>
                        </div>
                        {pin.pin_id && (
                          <a
                            href={`https://www.pinterest.com/pin/${pin.pin_id}/`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#e0e0e0',
                              textDecoration: 'none',
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '6px',
                              border: '1px solid #333',
                              background: '#1a1a1a',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.375rem',
                              transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#252525';
                              e.currentTarget.style.borderColor = '#444';
                              e.currentTarget.style.color = '#d2ccc6';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = '#1a1a1a';
                              e.currentTarget.style.borderColor = '#333';
                              e.currentTarget.style.color = '#e0e0e0';
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                            </svg>
                            View on Pinterest
                          </a>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CompactMetricCard({ 
  title, 
  value, 
  previous, 
  color, 
  isPercentage = false 
}: { 
  title: string; 
  value: string | number; 
  previous: number | string; 
  color: string; 
  isPercentage?: boolean;
}) {
  const currentNum = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) : value;
  const prevNum = typeof previous === 'string' ? parseFloat(previous.replace(/[^0-9.]/g, '')) : previous;
  
  const calculateChange = (current: number, prev: number): string => {
    if (prev === 0) return current > 0 ? '100' : '0';
    return ((current - prev) / prev * 100).toFixed(1);
  };
  
  const change = calculateChange(currentNum, prevNum);
  const isPositive = parseFloat(change) >= 0;

  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #2a2a2a',
        borderRadius: '6px',
        padding: '0.75rem',
      }}
    >
      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.25rem', fontWeight: 500 }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, color: color }}>
          {value}
        </div>
        {prevNum > 0 && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#4A90E2',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            {isPositive ? '↑' : '↓'} {Math.abs(parseFloat(change))}%
          </div>
        )}
      </div>
      {prevNum > 0 && (
        <div style={{ fontSize: '0.7rem', color: '#555' }}>
          vs previous period
        </div>
      )}
    </div>
  );
}

