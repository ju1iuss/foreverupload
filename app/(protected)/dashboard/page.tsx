'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Date Range Picker Component
function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  presetRange,
  onPresetChange,
}: {
  startDate: Date;
  endDate: Date;
  onRangeChange: (start: Date, end: Date) => void;
  presetRange: '7d' | '30d' | '90d' | 'custom';
  onPresetChange: (preset: '7d' | '30d' | '90d' | 'custom') => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewingMonth, setViewingMonth] = useState(new Date());
  const [selectingStart, setSelectingStart] = useState(true);
  const [tempStart, setTempStart] = useState<Date | null>(null);
  const [tempEnd, setTempEnd] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDisplayText = () => {
    if (presetRange === '7d') return 'Last 7 Days';
    if (presetRange === '30d') return 'Last 30 Days';
    if (presetRange === '90d') return 'Last 90 Days';
    return `${formatDateDisplay(startDate)} - ${formatDateDisplay(endDate)}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isSameDay = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getDate() === d2.getDate();
  };

  const isInRange = (date: Date) => {
    const start = tempStart || startDate;
    const end = tempEnd || endDate;
    return date >= start && date <= end;
  };

  const isStartDate = (date: Date) => {
    const start = tempStart || startDate;
    return isSameDay(date, start);
  };

  const isEndDate = (date: Date) => {
    const end = tempEnd || endDate;
    return isSameDay(date, end);
  };

  const handleDateClick = (date: Date) => {
    if (selectingStart) {
      setTempStart(date);
      setTempEnd(null);
      setSelectingStart(false);
    } else {
      if (tempStart && date < tempStart) {
        setTempStart(date);
        setTempEnd(tempStart);
      } else {
        setTempEnd(date);
      }
      setSelectingStart(true);
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      onRangeChange(tempStart, tempEnd);
      onPresetChange('custom');
    }
    setIsOpen(false);
    setTempStart(null);
    setTempEnd(null);
  };

  const handlePresetClick = (preset: '7d' | '30d' | '90d') => {
    onPresetChange(preset);
    const end = new Date();
    const start = new Date();
    const days = preset === '7d' ? 7 : preset === '30d' ? 30 : 90;
    start.setDate(start.getDate() - days);
    onRangeChange(start, end);
    setIsOpen(false);
    setTempStart(null);
    setTempEnd(null);
  };

  const renderCalendar = () => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    const days = [];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Day headers
    for (let i = 0; i < 7; i++) {
      days.push(
        <div
          key={`header-${i}`}
          style={{
            textAlign: 'center',
            fontSize: '0.7rem',
            color: '#666',
            padding: '0.25rem',
            fontWeight: 500,
          }}
        >
          {dayNames[i]}
        </div>
      );
    }

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isFuture = date > today;
      const inRange = !isFuture && isInRange(date);
      const isStart = isStartDate(date);
      const isEnd = isEndDate(date);
      const isToday = isSameDay(date, new Date());

      days.push(
        <button
          key={day}
          onClick={() => !isFuture && handleDateClick(date)}
          disabled={isFuture}
          style={{
            width: '32px',
            height: '32px',
            border: 'none',
            borderRadius: isStart || isEnd ? '6px' : '0',
            background: isStart || isEnd
              ? '#4A90E2'
              : inRange
              ? 'rgba(74, 144, 226, 0.2)'
              : 'transparent',
            color: isFuture 
              ? '#444' 
              : isStart || isEnd 
              ? '#fff' 
              : isToday 
              ? '#4A90E2' 
              : '#d2ccc6',
            cursor: isFuture ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: isStart || isEnd || isToday ? 600 : 400,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!isFuture && !isStart && !isEnd) {
              e.currentTarget.style.background = 'rgba(74, 144, 226, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isFuture && !isStart && !isEnd) {
              e.currentTarget.style.background = inRange
                ? 'rgba(74, 144, 226, 0.2)'
                : 'transparent';
            }
          }}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '8px',
          color: '#d2ccc6',
          fontSize: '0.8125rem',
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#444';
          e.currentTarget.style.background = '#222';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#333';
          e.currentTarget.style.background = '#1a1a1a';
        }}
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
            fill="currentColor"
          />
        </svg>
        {getDisplayText()}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            padding: '1rem',
            minWidth: '300px',
          }}
        >
          {/* Month Navigation */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <button
              onClick={() => setViewingMonth(new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() - 1))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#d2ccc6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d2ccc6' }}>
              {viewingMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setViewingMonth(new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1))}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#999',
                cursor: 'pointer',
                padding: '0.25rem',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#d2ccc6')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#999')}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Selection hint */}
          <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.5rem', textAlign: 'center' }}>
            {selectingStart ? 'Select start date' : 'Select end date'}
          </div>

          {/* Calendar Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '2px',
              marginBottom: '1rem',
            }}
          >
            {renderCalendar()}
          </div>

          {/* Apply button for custom range */}
          {(tempStart || tempEnd) && (
            <button
              onClick={handleApply}
              disabled={!tempStart || !tempEnd}
              style={{
                width: '100%',
                padding: '0.5rem',
                background: tempStart && tempEnd ? '#4A90E2' : '#333',
                border: 'none',
                borderRadius: '6px',
                color: tempStart && tempEnd ? '#fff' : '#666',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: tempStart && tempEnd ? 'pointer' : 'not-allowed',
                marginBottom: '1rem',
                transition: 'all 0.2s',
              }}
            >
              Apply Custom Range
            </button>
          )}

          {/* Divider */}
          <div style={{ height: '1px', background: '#333', marginBottom: '0.75rem' }} />

          {/* Quick Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Select
            </div>
            {[
              { key: '7d' as const, label: 'Last 7 Days' },
              { key: '30d' as const, label: 'Last 30 Days' },
              { key: '90d' as const, label: 'Last 90 Days' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handlePresetClick(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.5rem 0.75rem',
                  background: presetRange === key ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: presetRange === key ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  if (presetRange !== key) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (presetRange !== key) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                {label}
                {presetRange === key && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 7L6 10L11 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [presetRange, setPresetRange] = useState<'7d' | '30d' | '90d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
  });
  const [endDate, setEndDate] = useState<Date>(new Date());
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const handleRangeChange = (start: Date, end: Date) => {
    setStartDate(start);
    setEndDate(end);
  };

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
        .select('id, status, created_at, posted_at, scheduled_at, title, image_url, error_message')
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
        // Add failed pins for display
        failedPinsData: allPins?.filter((p) => p.status === 'failed') || [],
      } as any);
    } catch (err) {
      console.error('Error loading metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate filtered metrics based on date range
  const getFilteredMetrics = () => {
    if (!metrics) return null;

    const cutoffDate = new Date(startDate);
    cutoffDate.setHours(0, 0, 0, 0);
    
    const endDateCopy = new Date(endDate);
    endDateCopy.setHours(23, 59, 59, 999);

    const daysDiff = Math.ceil((endDateCopy.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevCutoffDate = new Date(cutoffDate);
    prevCutoffDate.setDate(prevCutoffDate.getDate() - daysDiff);

    // Filter daily metrics
    const filteredDailyMetrics = metrics.dailyMetrics.filter(m => {
      const d = new Date(m.date);
      return d >= cutoffDate && d <= endDateCopy;
    });
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
    const filteredPinsPostedOverTime = metrics.pinsPostedOverTime.filter(p => {
      const d = new Date(p.date);
      return d >= cutoffDate && d <= endDateCopy;
    });

    // Filter status counts based on the range (using created_at or posted_at)
    const allPins = (metrics as any).allPinsRaw || [];
    const pinsInRange = allPins.filter((p: any) => {
      const date = p.posted_at ? new Date(p.posted_at) : new Date(p.created_at);
      return date >= cutoffDate && date <= endDateCopy;
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

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
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
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#d2ccc6',
              fontSize: '0.8125rem',
              fontWeight: 500,
              cursor: (refreshing || loading) ? 'not-allowed' : 'pointer',
              opacity: (refreshing || loading) ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              if (!refreshing && !loading) {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.background = '#222';
              }
            }}
            onMouseLeave={(e) => {
              if (!refreshing && !loading) {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.background = '#1a1a1a';
              }
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}
            >
              <style>{`
                @keyframes spin {
                  from { transform: rotate(0deg); }
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <path
                d="M10 3v2M10 15v2M17 10h-2M5 10H3M15.657 4.343l-1.414 1.414M5.757 14.243l-1.414 1.414M15.657 15.657l-1.414-1.414M5.757 5.757l-1.414-1.414"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onRangeChange={handleRangeChange}
            presetRange={presetRange}
            onPresetChange={setPresetRange}
          />
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

          {/* Failed Posts Section */}
          {filteredMetrics && (filteredMetrics as any).failedPinsData && (filteredMetrics as any).failedPinsData.length > 0 && (
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #ef4444',
                borderRadius: '8px',
                padding: '1rem',
                marginTop: '1.5rem',
              }}
            >
              <div style={{ marginBottom: '0.75rem' }}>
                <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Failed Posts ({(filteredMetrics as any).failedPinsData.length})
                </h2>
                <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem', marginBottom: 0 }}>
                  Posts that failed to publish to Pinterest. Click to view error details.
                </p>
              </div>
              <div style={{ display: 'grid', gap: '0.5rem' }}>
                {(filteredMetrics as any).failedPinsData
                  .sort((a: any, b: any) => {
                    const aDate = a.scheduled_at ? new Date(a.scheduled_at).getTime() : new Date(a.created_at).getTime();
                    const bDate = b.scheduled_at ? new Date(b.scheduled_at).getTime() : new Date(b.created_at).getTime();
                    return bDate - aDate;
                  })
                  .slice(0, 10)
                  .map((pin: any) => {
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
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          transition: 'all 0.2s',
                          alignItems: 'flex-start',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
                          e.currentTarget.style.background = '#2a2a2a';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                          e.currentTarget.style.background = '#252525';
                        }}
                      >
                        {pin.image_url && (
                          <img
                            src={pin.image_url}
                            alt={pin.title || 'Failed pin'}
                            style={{
                              width: '64px',
                              height: '64px',
                              objectFit: 'cover',
                              borderRadius: '4px',
                              flexShrink: 0,
                            }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8125rem', fontWeight: 500, color: '#d2ccc6', marginBottom: '0.5rem' }}>
                            {pin.title || 'Untitled Pin'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div style={{ 
                              padding: '0.5rem', 
                              background: 'rgba(239, 68, 68, 0.1)', 
                              borderRadius: '4px',
                              border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                              <div style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span>⚠</span>
                                <span>Pinterest Error</span>
                              </div>
                              {pin.error_message ? (
                                <div style={{ color: '#d2ccc6', fontSize: '0.75rem', lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                  {pin.error_message}
                                </div>
                              ) : (
                                <div style={{ color: '#999', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                  No error message available
                                </div>
                              )}
                            </div>
                            {pin.scheduled_at && (
                              <div style={{ color: '#666', fontSize: '0.7rem' }}>
                                Scheduled for: {formatDate(pin.scheduled_at)}
                              </div>
                            )}
                          </div>
                        </div>
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

