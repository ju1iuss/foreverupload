'use client';

import { useState } from 'react';
import { Pin, PinCard } from './PinCard';

interface ContentPoolViewProps {
  pins: Pin[];
  onRefresh?: () => void;
}

export default function ContentPoolView({ pins, onRefresh }: ContentPoolViewProps) {
  const [currentlyViewedPinId, setCurrentlyViewedPinId] = useState<string | null>(null);

  const sortedPins = [...pins].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Cron runs every hour from 8am to 5pm
  const CRON_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const DAILY_LIMIT = 6;

  const getNextCronTime = (): Date => {
    const now = new Date();
    const currentHour = now.getHours();
    
    for (const hour of CRON_HOURS) {
      if (hour > currentHour) {
        const nextCron = new Date(now);
        nextCron.setHours(hour, 0, 0, 0);
        return nextCron;
      }
    }

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  };

  const calculateNextExecutionTime = (pin: Pin, allPins: Pin[]): Date | null => {
    if (pin.status === 'posted') return null;

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const postedToday = allPins.filter(
      (p) => p.status === 'posted' && p.posted_at && new Date(p.posted_at) >= today && new Date(p.posted_at) <= todayEnd
    ).length;

    const pendingPins = allPins
      .filter((p) => p.status === 'pending')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const pinIndex = pendingPins.findIndex((p) => p.id === pin.id);
    if (pinIndex === -1) return getNextCronTime();

    const postsRemainingToday = Math.max(0, DAILY_LIMIT - postedToday);
    
    if (pinIndex < postsRemainingToday) {
      return getNextCronTime();
    }

    const postsAhead = pinIndex - postsRemainingToday;
    const daysNeeded = Math.ceil((postsAhead + 1) / DAILY_LIMIT);
    
    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysNeeded);
    nextDate.setHours(CRON_HOURS[0], 0, 0, 0);
    
    return nextDate;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === tomorrowStr) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const getDateLabel = (pin: Pin, allPins: Pin[]) => {
    if (pin.status === 'posted' && pin.posted_at) {
      return `Posted: ${formatDate(pin.posted_at)}`;
    }
    
    const nextExecution = calculateNextExecutionTime(pin, allPins);
    if (nextExecution) {
      const now = new Date();
      const diffMs = nextExecution.getTime() - now.getTime();
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      
      if (diffMs < 0) return 'Processing soon...';
      if (diffHours < 24) return `Next run: ${formatTime(nextExecution.toISOString())}`;
      return `Next run: ${formatDate(nextExecution.toISOString())} ${formatTime(nextExecution.toISOString())}`;
    }
    
    return `Created: ${formatDate(pin.created_at)}`;
  };

  const handlePostNow = async (pin: Pin): Promise<boolean> => {
    if (pin.status === 'posted') return false;

    // Check daily limit
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const postedToday = pins.filter(
      (p) => p.status === 'posted' && p.posted_at && new Date(p.posted_at) >= today && new Date(p.posted_at) <= todayEnd
    ).length;

    if (postedToday >= DAILY_LIMIT) {
      alert(`Daily limit reached! You've already posted ${DAILY_LIMIT} pins today. Please try again tomorrow.`);
      return false;
    }

    try {
      const response = await fetch('/api/pinterest/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin_id: pin.id }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      // Check for success - API returns { success: true, pinId: ... }
      if (result.success) {
        if (onRefresh) setTimeout(() => onRefresh(), 1500);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Error posting pin:', error);
      alert(`Failed to post: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleDeletePin = async (pin: Pin) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('pin_scheduled')
        .delete()
        .eq('id', pin.id);

      if (error) throw error;
      if (onRefresh) onRefresh();
    } catch (error: any) {
      console.error('Error deleting pin:', error);
      alert(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next', currentPin: Pin) => {
    const currentIndex = sortedPins.findIndex((p) => p.id === currentPin.id);
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentlyViewedPinId(sortedPins[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < sortedPins.length - 1) {
      setCurrentlyViewedPinId(sortedPins[currentIndex + 1].id);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted': return '#22c55e';
      case 'failed': return '#ef4444';
      default: return '#FF006F';
    }
  };

  const postedPins = sortedPins.filter((pin) => pin.status === 'posted');
  const readyPins = sortedPins.filter((pin) => pin.status !== 'posted');

  // Calculate posts posted today
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setHours(23, 59, 59, 999);

  const postedToday = postedPins.filter(
    (p) => p.posted_at && new Date(p.posted_at) >= today && new Date(p.posted_at) <= todayEnd
  ).length;

  const canPostMore = postedToday < DAILY_LIMIT;

  return (
    <div>
      <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#191919', borderRadius: '6px', border: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '0.75rem', color: '#999', margin: 0 }}>
          Pins are not posted automatically. You can post manually here.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#999' }}>Daily limit:</span>
          <span style={{ 
            fontSize: '0.875rem', 
            fontWeight: 600, 
            color: canPostMore ? '#22c55e' : '#ef4444' 
          }}>
            {postedToday}/{DAILY_LIMIT}
          </span>
          {!canPostMore && (
            <span style={{ fontSize: '0.7rem', color: '#ef4444', marginLeft: '0.25rem' }}>
              (Limit reached)
            </span>
          )}
        </div>
      </div>
      
      {/* Ready Posts Section */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
          Ready ({readyPins.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {readyPins.map((pin) => (
            <PinCard
              key={pin.id}
              pin={pin}
              allPins={pins}
              onPostNow={handlePostNow}
              onDelete={handleDeletePin}
              formatTime={formatTime}
              getDateLabel={(p, all) => getDateLabel(p, all)}
              getStatusColor={getStatusColor}
              currentlyViewedPinId={currentlyViewedPinId}
              onSetViewedPin={setCurrentlyViewedPinId}
              onNavigate={handleNavigate}
              canPost={canPostMore}
            />
          ))}
          {readyPins.length === 0 && (
            <div style={{ 
              padding: '1rem', 
              textAlign: 'center', 
              color: '#666',
              background: '#191919',
              borderRadius: '6px',
              border: '1px solid #333',
              fontSize: '0.75rem'
            }}>
              No ready posts
            </div>
          )}
        </div>
      </div>

      {/* Posted Posts Section */}
      <div>
        <h2 style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#fff', marginBottom: '0.5rem' }}>
          Posted ({postedPins.length})
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {postedPins.map((pin) => (
          <PinCard
            key={pin.id}
            pin={pin}
            allPins={pins}
            onPostNow={handlePostNow}
            onDelete={handleDeletePin}
            formatTime={formatTime}
            getDateLabel={(p, all) => getDateLabel(p, all)}
            getStatusColor={getStatusColor}
            currentlyViewedPinId={currentlyViewedPinId}
            onSetViewedPin={setCurrentlyViewedPinId}
            onNavigate={handleNavigate}
            canPost={false}
          />
        ))}
          {postedPins.length === 0 && (
            <div style={{ 
              padding: '1rem', 
              textAlign: 'center', 
              color: '#666',
              background: '#191919',
              borderRadius: '6px',
              border: '1px solid #333',
              fontSize: '0.75rem'
            }}>
              No posted content
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
