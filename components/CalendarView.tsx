'use client';

import { useState } from 'react';

interface Pin {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  scheduled_at?: string;
  created_at: string;
  status: 'pending' | 'posted' | 'failed';
  posted_at: string | null;
}

interface CalendarViewProps {
  pins: Pin[];
  onRefresh?: () => void;
}

interface PinCardProps {
  pin: Pin;
  allPins: Pin[];
  onPostNow: (pin: Pin) => Promise<boolean>;
  onDelete: (pin: Pin) => Promise<void>;
  formatTime: (dateString: string) => string;
  getDateLabel: (pin: Pin, allPins: Pin[]) => string;
  getStatusColor: (status: string) => string;
  currentlyViewedPinId: string | null;
  onSetViewedPin: (pinId: string | null) => void;
  onNavigate?: (direction: 'prev' | 'next', currentPin: Pin) => void;
}

function PinCard({ pin, allPins, onPostNow, onDelete, formatTime, getDateLabel, getStatusColor, currentlyViewedPinId, onSetViewedPin, onNavigate }: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const showQuickView = currentlyViewedPinId === pin.id;

  const handlePostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPosting(true);
    setPostSuccess(false);
    try {
      const success = await onPostNow(pin);
      if (success) {
        setPostSuccess(true);
        setTimeout(() => {
          setPostSuccess(false);
          setIsPosting(false);
        }, 2000);
      } else {
        setIsPosting(false);
      }
    } catch (error) {
      setIsPosting(false);
      setPostSuccess(false);
    }
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onDelete(pin);
    onSetViewedPin(null);
  };

  return (
    <>
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSetViewedPin(pin.id)}
        style={{
          background: '#252525',
          border: pin.status === 'posted' ? '1px solid #4A90E2' : '1px solid #333',
          borderRadius: '4px',
          overflow: 'hidden',
          fontSize: '0.65rem',
          position: 'relative',
          aspectRatio: '1',
          cursor: 'pointer',
        }}
      >
      {pin.image_url && (
        <>
          <img
            src={pin.image_url}
            alt={pin.title || 'Scheduled pin'}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Text overlay on image */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.5), transparent)',
              padding: '0.4rem',
              color: '#d2ccc6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.2rem' }}>
              <div
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getStatusColor(pin.status),
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: '0.6rem', fontWeight: 500 }}>
                {formatTime(pin.status === 'posted' && pin.posted_at ? pin.posted_at : pin.created_at)}
              </span>
            </div>
            <div style={{ fontSize: '0.55rem', color: '#ccc', marginBottom: '0.15rem', lineHeight: '1.2' }}>
              {getDateLabel(pin, allPins)}
            </div>
            {pin.title && (
              <div style={{ fontSize: '0.6rem', fontWeight: 500, lineHeight: '1.2', marginTop: '0.15rem' }}>
                {pin.title.substring(0, 40)}{pin.title.length > 40 ? '...' : ''}
              </div>
            )}
          </div>
        </>
      )}
      {/* Expand icon - only visible on hover */}
      {isHovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSetViewedPin(pin.id);
          }}
          style={{
            position: 'absolute',
            top: '0.25rem',
            left: '0.25rem',
            padding: '0.2rem',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '3px',
            color: '#d2ccc6',
            fontSize: '0.65rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '18px',
            height: '18px',
            lineHeight: 1,
          }}
          title="View details"
        >
          ⛶
        </button>
      )}
    </div>
    
    {/* Quick View Modal */}
    {showQuickView && (
      <div
        onClick={() => onSetViewedPin(null)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem',
        }}
      >
        {/* Navigation chevrons - positioned relative to backdrop */}
        {onNavigate && (() => {
          const sortedPins = [...allPins].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          const currentIndex = sortedPins.findIndex((p) => p.id === pin.id);
          const hasPrev = currentIndex > 0;
          const hasNext = currentIndex < sortedPins.length - 1;
          
          return (
            <>
              {hasPrev && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('prev', pin);
                  }}
                  style={{
                    position: 'absolute',
                    left: '2rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#fff',
                    border: '2px solid #fff',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    color: '#000',
                    fontSize: '2rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4A90E2';
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.color = '#d2ccc6';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#fff';
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  ‹
                </button>
              )}
              {hasNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('next', pin);
                  }}
                  style={{
                    position: 'absolute',
                    right: '2rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#fff',
                    border: '2px solid #fff',
                    borderRadius: '50%',
                    width: '56px',
                    height: '56px',
                    color: '#000',
                    fontSize: '2rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1001,
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.6)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#4A90E2';
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.color = '#d2ccc6';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#fff';
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
                  }}
                >
                  ›
                </button>
              )}
            </>
          );
        })()}

        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
          }}
        >
          {/* Close button */}
          <button
            onClick={() => onSetViewedPin(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: '#333',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#d2ccc6',
              fontSize: '1.25rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
          >
            ×
          </button>

          {/* Image */}
          {pin.image_url && (
            <img
              src={pin.image_url}
              alt={pin.title || 'Scheduled pin'}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'contain',
                background: '#000',
              }}
            />
          )}

          {/* Content */}
          <div style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: getStatusColor(pin.status),
                }}
              />
              <span style={{ fontSize: '0.875rem', color: '#999', textTransform: 'capitalize' }}>
                {pin.status}
              </span>
              <span style={{ fontSize: '0.875rem', color: '#666' }}>•</span>
              <span style={{ fontSize: '0.875rem', color: '#999' }}>
                {formatTime(pin.status === 'posted' && pin.posted_at ? pin.posted_at : pin.created_at)}
              </span>
            </div>

            {pin.title && (
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#d2ccc6' }}>
                {pin.title}
              </h3>
            )}

            {pin.description && (
              <p style={{ fontSize: '0.9375rem', color: '#ccc', marginBottom: '1rem', lineHeight: '1.6' }}>
                {pin.description}
              </p>
            )}

            <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1.5rem' }}>
              {getDateLabel(pin, allPins)}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {pin.status !== 'posted' && (
                <button
                  onClick={handlePostClick}
                  disabled={isPosting || postSuccess}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: postSuccess ? '#22c55e' : (isPosting ? '#555' : '#4A90E2'),
                    border: 'none',
                    borderRadius: '6px',
                    color: '#d2ccc6',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    cursor: (isPosting || postSuccess) ? 'not-allowed' : 'pointer',
                    flex: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    transform: postSuccess ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {postSuccess ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{ 
                        animation: 'checkmark 0.5s ease-in-out',
                        display: 'inline-block',
                        fontSize: '1.2rem',
                        fontWeight: 700
                      }}>✓</span>
                      Posted!
                    </span>
                  ) : isPosting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '12px',
                        height: '12px',
                        border: '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                      }} />
                      Posting...
                    </span>
                  ) : (
                    'Post Now'
                  )}
                </button>
              )}
              <button
                onClick={handleDeleteClick}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a2a';
                  e.currentTarget.style.borderColor = '#444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = '#333';
                }}
              >
                <span>🗑️</span>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function CalendarView({ pins, onRefresh }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<'compact' | 'extended'>('compact');
  const [currentlyViewedPinId, setCurrentlyViewedPinId] = useState<string | null>(null);
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday

  const daysToShow = viewMode === 'compact' ? 6 : 28;
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const getPinsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Check if this date is in the past
    const dateTime = date.getTime();
    const todayTime = today.getTime();
    const isPast = dateTime < todayTime;
    
    const dayPins = pins.filter((pin) => {
      // For posted pins, use posted_at
      if (pin.status === 'posted' && pin.posted_at) {
        const pinDate = new Date(pin.posted_at).toISOString().split('T')[0];
        return pinDate === dateStr;
      }
      
      // For pending posts, never show them in the past
      if (pin.status === 'pending') {
        if (isPast) {
          return false; // Never show pending posts in the past
        }
        
        // Get all pending pins sorted by created_at (oldest first)
        const pendingPins = pins
          .filter((p) => p.status === 'pending')
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        
        const pinIndex = pendingPins.findIndex((p) => p.id === pin.id);
        if (pinIndex === -1) return false;
        
        // Calculate which day this post will be posted (6 posts per day)
        // Ensure it's at least today (daysFromToday >= 0)
        const daysFromToday = Math.max(0, Math.floor(pinIndex / 6));
        const estimatedPostDate = new Date(today);
        estimatedPostDate.setDate(today.getDate() + daysFromToday);
        const estimatedDateStr = estimatedPostDate.toISOString().split('T')[0];
        
        return estimatedDateStr === dateStr;
      }
      
      return false;
    });
    
    // Sort by created_at (oldest first) so oldest posts appear first
    return dayPins.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) {
      return 'Today';
    } else if (dateStr === tomorrowStr) {
      return 'Tomorrow';
    } else if (dateStr === yesterdayStr) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'posted':
        return '#22c55e';
      case 'failed':
        return '#ef4444';
      default:
        return '#4A90E2';
    }
  };

  // Cron runs every hour from 8am to 5pm (8, 9, 10, 11, 12, 13, 14, 15, 16, 17)
  const CRON_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const DAILY_LIMIT = 6;

  const getNextCronTime = (): Date => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Find next cron hour today
    for (const hour of CRON_HOURS) {
      if (hour > currentHour || (hour === currentHour && currentMinute < 0)) {
        const nextCron = new Date(now);
        nextCron.setHours(hour, 0, 0, 0);
        return nextCron;
      }
    }

    // If past 5pm, schedule for tomorrow at 8am
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    return tomorrow;
  };

  const calculateNextExecutionTime = (pin: Pin, allPins: Pin[]): Date | null => {
    if (pin.status === 'posted') {
      return null; // Already posted
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    // Count how many posts have been posted today
    const postedToday = allPins.filter(
      (p) => p.status === 'posted' && p.posted_at && new Date(p.posted_at) >= today && new Date(p.posted_at) <= todayEnd
    ).length;

    // Get all pending pins ordered by created_at (oldest first)
    const pendingPins = allPins
      .filter((p) => p.status === 'pending')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Find position of this pin in the queue
    const pinIndex = pendingPins.findIndex((p) => p.id === pin.id);
    
    // All pending pins are in queue, pinIndex should always be found
    if (pinIndex === -1) {
      return getNextCronTime();
    }

    // Calculate which cron run will process this pin
    const postsRemainingToday = Math.max(0, DAILY_LIMIT - postedToday);
    
    if (pinIndex < postsRemainingToday) {
      // Will be processed in the next cron run today
      return getNextCronTime();
    }

    // This pin won't be processed today
    // Calculate how many posts ahead of today's limit
    const postsAhead = pinIndex - postsRemainingToday;
    const daysNeeded = Math.ceil((postsAhead + 1) / DAILY_LIMIT);
    
    // Start from tomorrow's first cron run
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + daysNeeded);
    tomorrow.setHours(CRON_HOURS[0], 0, 0, 0);
    
    return tomorrow;
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
      
      if (diffMs < 0) {
        return 'Processing soon...';
      } else if (diffHours < 24) {
        return `Next run: ${formatTime(nextExecution.toISOString())}`;
      } else {
        return `Next run: ${formatDate(nextExecution.toISOString())} ${formatTime(nextExecution.toISOString())}`;
      }
    }
    
    return `Created: ${formatDate(pin.created_at)}`;
  };

  const handleDeletePin = async (pin: Pin) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      const { error } = await supabase
        .from('pin_scheduled')
        .delete()
        .eq('id', pin.id);

      if (error) {
        console.error('Error deleting pin:', error);
        alert('Failed to delete post');
        return;
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('Error deleting pin:', error);
      alert(`Failed to delete: ${error.message || 'Unknown error'}`);
    }
  };

  const handlePostNow = async (pin: Pin): Promise<boolean> => {
    if (pin.status === 'posted') return false;

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        alert('Missing Supabase configuration');
        return false;
      }

      // Call the pin-post API route
      const response = await fetch('/api/pinterest/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin_id: pin.id }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Pin post result:', result);
      
      // Check if this specific pin was posted
      const pinResult = result.results?.find((r: any) => r.pinId === pin.id);
      
      if (pinResult?.status === 'posted') {
        // Success - refresh immediately to update UI and move to today
        if (onRefresh) {
          setTimeout(() => onRefresh(), 500);
        }
        return true;
      } else if (pinResult?.status === 'failed') {
        alert(`Failed to post: ${pinResult.error || 'Unknown error'}`);
        if (onRefresh) {
          setTimeout(() => onRefresh(), 500);
        }
        return false;
      } else if (result.error) {
        // Error response from the function
        alert(`Failed to post: ${result.error}`);
        return false;
      } else if (result.message === 'Processing complete' && result.count > 0) {
        // Post was processed - check if it succeeded
        const anyPosted = result.results?.some((r: any) => r.status === 'posted');
        if (anyPosted) {
          if (onRefresh) {
            setTimeout(() => onRefresh(), 500);
          }
          return true;
        }
        // Something was processed but failed
        const firstFailed = result.results?.find((r: any) => r.status === 'failed');
        if (firstFailed) {
          alert(`Failed to post: ${firstFailed.error || 'Unknown error'}`);
        }
        if (onRefresh) {
          setTimeout(() => onRefresh(), 500);
        }
        return false;
      } else if (result.message?.includes('Daily post limit reached')) {
        alert('Daily post limit reached. This post will be processed tomorrow.');
        return false;
      } else {
        // Unknown response - refresh to check status
        console.log('Unknown response, refreshing to check status');
        if (onRefresh) {
          setTimeout(() => onRefresh(), 1000);
        }
        return false;
      }
    } catch (error: any) {
      console.error('Error posting pin:', error);
      alert(`Failed to post: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  const handleNavigate = (direction: 'prev' | 'next', currentPin: Pin) => {
    const sortedPins = [...pins].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    const currentIndex = sortedPins.findIndex((p) => p.id === currentPin.id);
    
    if (direction === 'prev' && currentIndex > 0) {
      setCurrentlyViewedPinId(sortedPins[currentIndex - 1].id);
    } else if (direction === 'next' && currentIndex < sortedPins.length - 1) {
      setCurrentlyViewedPinId(sortedPins[currentIndex + 1].id);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#252525', borderRadius: '7px', border: '1px solid #333' }}>
        <p style={{ fontSize: '1.0125rem', color: '#999', margin: 0, lineHeight: '1.4' }}>
          Plan your pins according to your daily schedule limit (max 6 per day).
        </p>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.875rem', color: '#999' }}>View</div>
        <div style={{ display: 'flex', gap: '0.25rem', background: '#191919', padding: '0.25rem', borderRadius: '6px', border: '1px solid #333' }}>
          <button
            onClick={() => setViewMode('compact')}
            style={{
              padding: '0.375rem 0.75rem',
              background: viewMode === 'compact' ? '#4A90E2' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: viewMode === 'compact' ? '#d2ccc6' : '#999',
              fontSize: '0.75rem',
              fontWeight: viewMode === 'compact' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            6 Days
          </button>
          <button
            onClick={() => setViewMode('extended')}
            style={{
              padding: '0.375rem 0.75rem',
              background: viewMode === 'extended' ? '#4A90E2' : 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: viewMode === 'extended' ? '#d2ccc6' : '#999',
              fontSize: '0.75rem',
              fontWeight: viewMode === 'extended' ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            28 Days
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '2rem' }}>
        {days.map((day, idx) => {
          const dayPins = getPinsForDay(day);
          const isToday = day.toDateString() === today.toDateString();

          return (
            <div
              key={idx}
              style={{
                background: isToday ? '#252525' : '#191919',
                border: isToday ? '2px solid #4A90E2' : '1px solid #333',
                borderRadius: '8px',
                padding: '0.75rem',
              }}
            >
              <div style={{ marginBottom: '0.5rem', fontSize: '0.8rem', color: '#999' }}>
                {day.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
                {day.getDate()}
              </div>
              {dayPins.length === 0 ? (
                <div style={{ color: '#666', fontSize: '0.75rem' }}>No posts</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                  {dayPins.map((pin) => (
                    <PinCard
                      key={pin.id}
                      pin={pin}
                      allPins={pins}
                      onPostNow={handlePostNow}
                      onDelete={handleDeletePin}
                      formatTime={formatTime}
                      getDateLabel={getDateLabel}
                      getStatusColor={getStatusColor}
                      currentlyViewedPinId={currentlyViewedPinId}
                      onSetViewedPin={setCurrentlyViewedPinId}
                      onNavigate={viewMode === 'extended' ? handleNavigate : undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

