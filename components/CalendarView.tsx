'use client';

import { useState, useRef, useEffect } from 'react';

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
                    left: '5vw',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#d2ccc6',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    zIndex: 1001,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
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
                    right: '5vw',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#d2ccc6',
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    zIndex: 1001,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
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
            background: '#191919',
            borderRadius: '12px',
            width: pin.status === 'pending' ? '90%' : 'auto',
            maxWidth: pin.status === 'pending' ? '1000px' : '600px',
            maxHeight: pin.status === 'pending' ? '85vh' : '90vh',
            display: pin.status === 'pending' ? 'flex' : 'block',
            flexDirection: pin.status === 'pending' ? 'row' : 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #333',
            position: 'relative',
          }}
        >
          {/* Close button in top right of modal */}
          <button
            onClick={() => onSetViewedPin(null)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#d2ccc6',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            ×
          </button>

          {/* Image Container - Left Side (for pending) or Top (for others) */}
          {pin.image_url && (
            <div style={{
              ...(pin.status === 'pending' ? {
                flex: '1.2',
                background: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
              } : {
                width: '100%',
                background: '#000',
              })
            }}>
              <img
                src={pin.image_url}
                alt={pin.title || 'Pin image'}
                style={{
                  ...(pin.status === 'pending' ? {
                    maxWidth: '100%',
                    maxHeight: '85vh',
                    objectFit: 'contain',
                  } : {
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                  })
                }}
              />
            </div>
          )}

          {/* Details Container - Right Side (for pending) or Bottom (for others) */}
          <div style={{
            ...(pin.status === 'pending' ? {
              flex: '0.8',
              padding: '2.5rem',
              display: 'flex',
              flexDirection: 'column',
              borderLeft: '1px solid #333',
              background: '#191919',
              overflowY: 'auto',
            } : {
              padding: '1.5rem',
            })
          }}>
            <div style={{ marginBottom: pin.status === 'pending' ? '2rem' : '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: postSuccess ? '#22c55e' : getStatusColor(pin.status),
                    transition: 'background 0.3s ease',
                  }}
                />
                <span style={{
                  fontSize: pin.status === 'pending' ? '0.875rem' : '0.875rem',
                  fontWeight: pin.status === 'pending' ? 600 : 400,
                  color: postSuccess ? '#22c55e' : (pin.status === 'pending' ? getStatusColor(pin.status) : '#999'),
                  textTransform: pin.status === 'pending' ? 'uppercase' : 'capitalize',
                  letterSpacing: pin.status === 'pending' ? '0.05em' : 'normal',
                  transition: 'color 0.3s ease',
                }}>
                  {postSuccess ? 'posted' : pin.status}
                </span>
                {pin.status !== 'pending' && (
                  <>
                    <span style={{ fontSize: '0.875rem', color: '#666' }}>•</span>
                    <span style={{ fontSize: '0.875rem', color: '#999' }}>
                      {formatTime(pin.status === 'posted' && pin.posted_at ? pin.posted_at : pin.created_at)}
                    </span>
                  </>
                )}
              </div>
              <h2 style={{
                fontSize: pin.status === 'pending' ? '1.75rem' : '1.25rem',
                fontWeight: 700,
                color: '#d2ccc6',
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                {pin.title || 'Untitled Post'}
              </h2>
              <p style={{
                fontSize: pin.status === 'pending' ? '1.05rem' : '0.9375rem',
                color: pin.status === 'pending' ? '#aaa' : '#ccc',
                lineHeight: '1.6',
                marginBottom: pin.status === 'pending' ? '1.5rem' : '1rem',
                whiteSpace: 'pre-wrap'
              }}>
                {pin.description || 'No description provided.'}
              </p>
              {pin.status === 'pending' && (
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1.5rem' }}>
                  {getDateLabel(pin, allPins)}
                </div>
              )}
              {pin.status !== 'pending' && (
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '1.5rem' }}>
                  {getDateLabel(pin, allPins)}
                </div>
              )}
            </div>

            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
              @keyframes pulse-success {
                0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
                50% { transform: scale(1.02); box-shadow: 0 0 20px 5px rgba(34, 197, 94, 0.3); }
              }
              @keyframes checkmark-pop {
                0% { transform: scale(0); opacity: 0; }
                50% { transform: scale(1.3); }
                100% { transform: scale(1); opacity: 1; }
              }
            `}</style>
            <div style={{ marginTop: pin.status === 'pending' ? 'auto' : '0', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pin.status !== 'posted' && (
                <button
                  onClick={handlePostClick}
                  disabled={isPosting || postSuccess}
                  style={{
                    padding: pin.status === 'pending' ? '1rem' : '0.75rem 1.5rem',
                    background: postSuccess ? '#22c55e' : (isPosting ? '#555' : '#4A90E2'),
                    border: 'none',
                    borderRadius: '6px',
                    color: '#d2ccc6',
                    fontSize: pin.status === 'pending' ? '1rem' : '0.875rem',
                    fontWeight: 700,
                    cursor: (isPosting || postSuccess) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: pin.status === 'pending' ? '52px' : 'auto',
                    animation: postSuccess ? 'pulse-success 0.6s ease-in-out' : 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isPosting && !postSuccess) e.currentTarget.style.background = '#357ABD';
                  }}
                  onMouseLeave={(e) => {
                    if (!isPosting && !postSuccess) e.currentTarget.style.background = '#4A90E2';
                  }}
                >
                  {postSuccess ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: pin.status === 'pending' ? '1.4rem' : '1.2rem',
                        fontWeight: 700,
                        animation: 'checkmark-pop 0.4s ease-out forwards'
                      }}>✓</span>
                      {pin.status === 'pending' ? 'Posted Successfully!' : 'Posted!'}
                    </span>
                  ) : isPosting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: pin.status === 'pending' ? '0.75rem' : '0.5rem' }}>
                      <span style={{
                        display: 'inline-block',
                        width: pin.status === 'pending' ? '18px' : '12px',
                        height: pin.status === 'pending' ? '18px' : '12px',
                        border: pin.status === 'pending' ? '3px solid rgba(255, 255, 255, 0.2)' : '2px solid rgba(255, 255, 255, 0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite'
                      }} />
                      {pin.status === 'pending' ? 'Posting to Pinterest...' : 'Posting...'}
                    </span>
                  ) : (
                    <>
                      {pin.status === 'pending' && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                        </svg>
                      )}
                      Post Now
                    </>
                  )}
                </button>
              )}
              {pin.status === 'posted' && (pin as any).pin_id && (
                <a
                  href={`https://www.pinterest.com/pin/${(pin as any).pin_id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '1rem',
                    background: '#252525',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#d2ccc6',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: '52px',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#2a2a2a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#252525';
                  }}
                >
                  <span>See on Pinterest</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </a>
              )}
              {pin.status !== 'posted' && (
                <button
                  onClick={handleDeleteClick}
                  style={{
                    padding: pin.status === 'pending' ? '0.75rem 1.5rem' : '0.75rem 1.5rem',
                    background: 'transparent',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: pin.status === 'pending' ? '0.875rem' : '0.875rem',
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
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default function CalendarView({ pins, onRefresh }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<6 | 12 | 28>(6);
  const [currentlyViewedPinId, setCurrentlyViewedPinId] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState(0); // Number of weeks to offset from current week
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  
  const getStartOfPeriod = (offset: number) => {
    const start = new Date(today);
    // Move by the number of days in the view mode, not by weeks
    start.setDate(today.getDate() + (offset * viewMode));
    return start;
  };
  
  const startOfPeriod = getStartOfPeriod(weekOffset);

  const daysToShow = viewMode;
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(startOfPeriod);
    date.setDate(startOfPeriod.getDate() + i);
    return date;
  });
  
  const handlePrevious = () => {
    setWeekOffset(weekOffset - 1);
  };
  
  const handleNext = () => {
    setWeekOffset(weekOffset + 1);
  };
  
  const handleToday = () => {
    setWeekOffset(0);
    setDropdownOpen(false);
  };
  
  const handleQuickJump = (weeks: number) => {
    setWeekOffset(weeks);
    setDropdownOpen(false);
  };
  
  const handleViewModeChange = (mode: 6 | 12 | 28) => {
    setViewMode(mode);
    setDropdownOpen(false);
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [dropdownOpen]);
  
  // Constants
  const DAILY_LIMIT = 6;
  const CRON_HOURS = [8, 9, 10, 11, 12, 13];
  
  // Get the date range label
  const getDateRangeLabel = () => {
    const start = days[0];
    const end = days[days.length - 1];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    
    if (startMonth === endMonth && startYear === endYear) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${startYear}`;
    } else if (startYear === endYear) {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${startYear}`;
    } else {
      return `${startMonth} ${start.getDate()}, ${startYear} - ${endMonth} ${end.getDate()}, ${endYear}`;
    }
  };

  const formatDateString = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const getPinsForDay = (date: Date) => {
    const dateStr = formatDateString(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = formatDateString(today);
    
    // Check if this date is in the past
    const isPast = date < today;
    
    // Count how many posts have been posted today (for queue calculation)
    const postedToday = pins.filter((p) => {
      if (p.status !== 'posted' || !p.posted_at) return false;
      const pDate = new Date(p.posted_at);
      return formatDateString(pDate) === todayStr;
    }).length;
    
    // Get all pending pins sorted by created_at (oldest first)
    const pendingPins = pins
      .filter((p) => p.status === 'pending')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    const dayPins = pins.filter((pin) => {
      // For posted pins, use posted_at date
      if (pin.status === 'posted' && pin.posted_at) {
        const postedDate = new Date(pin.posted_at);
        const postedDateStr = postedDate.getFullYear() + '-' + 
                              String(postedDate.getMonth() + 1).padStart(2, '0') + '-' + 
                              String(postedDate.getDate()).padStart(2, '0');
        const matches = postedDateStr === dateStr;
        
        // Debug log
        if (matches) {
          console.log('Posted pin matched:', pin.id, 'posted_at:', pin.posted_at, 'dateStr:', dateStr);
        }
        
        return matches;
      }
      
      // For pending posts, use scheduled_at if available, otherwise fall back to queue calculation
      if (pin.status === 'pending') {
        // If scheduled_at exists, use it directly
        if (pin.scheduled_at) {
          const scheduledDate = new Date(pin.scheduled_at);
          const scheduledDateStr = scheduledDate.getFullYear() + '-' + 
                                    String(scheduledDate.getMonth() + 1).padStart(2, '0') + '-' + 
                                    String(scheduledDate.getDate()).padStart(2, '0');
          return scheduledDateStr === dateStr;
        }
        
        // Fallback: calculate based on queue position (for backward compatibility)
        // Never show pending posts in the past
        if (isPast) return false;
        
        const pinIndex = pendingPins.findIndex((p) => p.id === pin.id);
        if (pinIndex === -1) return false;
        
        // Calculate which day this post will be posted
        // Account for posts already posted today
        const postsRemainingToday = Math.max(0, DAILY_LIMIT - postedToday);
        
        if (pinIndex < postsRemainingToday) {
          // Will be posted today
          return dateStr === todayStr;
        }
        
        // Calculate which day in the future
        const postsAhead = pinIndex - postsRemainingToday;
        const daysNeeded = Math.ceil((postsAhead + 1) / DAILY_LIMIT);
        const estimatedPostDate = new Date(today);
        estimatedPostDate.setDate(today.getDate() + daysNeeded);
        
        return formatDateString(estimatedPostDate) === dateStr;
      }
      
      return false;
    });
    
    // Sort by scheduled_at (if available) or created_at, oldest first
    const sortedPins = dayPins.sort((a, b) => {
      const aTime = a.scheduled_at || a.created_at;
      const bTime = b.scheduled_at || b.created_at;
      return new Date(aTime).getTime() - new Date(bTime).getTime();
    });
    
    // Limit to DAILY_LIMIT (6) posts per day
    return sortedPins.slice(0, DAILY_LIMIT);
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

    // If scheduled_at exists, use it directly
    if (pin.scheduled_at) {
      return new Date(pin.scheduled_at);
    }

    // Fallback: calculate based on queue position (for backward compatibility)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStr = formatDateString(today);

    // Count how many posts have been posted today
    const postedToday = allPins.filter((p) => {
      if (p.status !== 'posted' || !p.posted_at) return false;
      const pDate = new Date(p.posted_at);
      return formatDateString(pDate) === todayStr;
    }).length;

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
    tomorrow.setDate(today.getDate() + daysNeeded);
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
        return formatDate(nextExecution.toISOString());
      } else {
        return formatDate(nextExecution.toISOString());
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
        <p style={{ fontSize: '0.9375rem', color: '#999', margin: 0, lineHeight: '1.5' }}>
          Plan your pins (max 6 per day). Pins post to Pinterest automatically at the times you schedule—you choose when each goes live.
        </p>
      </div>
      
      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '1rem', gap: '0.5rem' }}>
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: '#191919',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#999',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#252525';
            e.currentTarget.style.borderColor = '#444';
            e.currentTarget.style.color = '#d2ccc6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#191919';
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#999';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        
        {/* Date Range Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              background: '#191919',
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
              e.currentTarget.style.background = '#191919';
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
            {getDateRangeLabel()}
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{
                transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                left: '50%',
                transform: 'translateX(-50%)',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                zIndex: 1000,
                padding: '0.5rem',
                minWidth: '160px',
              }}
            >
              <button
                onClick={handleToday}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: weekOffset === 0 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: weekOffset === 0 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (weekOffset !== 0) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (weekOffset !== 0) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                Today
              </button>
              <button
                onClick={() => handleQuickJump(-1)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: weekOffset === -1 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: weekOffset === -1 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  marginTop: '0.25rem',
                }}
                onMouseEnter={(e) => {
                  if (weekOffset !== -1) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (weekOffset !== -1) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                Last Week
              </button>
              <button
                onClick={() => handleQuickJump(-2)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: weekOffset === -2 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: weekOffset === -2 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  marginTop: '0.25rem',
                }}
                onMouseEnter={(e) => {
                  if (weekOffset !== -2) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (weekOffset !== -2) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                2 Weeks Ago
              </button>
              <button
                onClick={() => handleQuickJump(1)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: weekOffset === 1 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: weekOffset === 1 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  marginTop: '0.25rem',
                }}
                onMouseEnter={(e) => {
                  if (weekOffset !== 1) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (weekOffset !== 1) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                Next Week
              </button>
              
              <div style={{ height: '1px', background: '#333', margin: '0.5rem 0' }} />
              
              <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.75rem' }}>
                Days to Show
              </div>
              
              <button
                onClick={() => handleViewModeChange(6)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 6 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: viewMode === 6 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 6) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 6) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                6 Days
              </button>
              
              <button
                onClick={() => handleViewModeChange(12)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 12 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: viewMode === 12 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  marginTop: '0.25rem',
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 12) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 12) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                12 Days
              </button>
              
              <button
                onClick={() => handleViewModeChange(28)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  background: viewMode === 28 ? 'rgba(74, 144, 226, 0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: viewMode === 28 ? '#4A90E2' : '#999',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  marginTop: '0.25rem',
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== 28) {
                    e.currentTarget.style.background = '#252525';
                    e.currentTarget.style.color = '#d2ccc6';
                  }
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== 28) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#999';
                  }
                }}
              >
                28 Days
              </button>
            </div>
          )}
        </div>
        
        {/* Next Button */}
        <button
          onClick={handleNext}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: '#191919',
            border: '1px solid #333',
            borderRadius: '6px',
            color: '#999',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#252525';
            e.currentTarget.style.borderColor = '#444';
            e.currentTarget.style.color = '#d2ccc6';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#191919';
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#999';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: (viewMode === 6 || viewMode === 28) ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
        gap: '0.5rem', 
        marginBottom: '2rem' 
      }}>
        {days.map((day, idx) => {
          const dayPins = getPinsForDay(day);
          const isToday = day.toDateString() === today.toDateString();
          
          // Debug for today
          if (isToday) {
            console.log('CalendarView: Rendering today with', dayPins.length, 'pins');
          }

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
                      onNavigate={handleNavigate}
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

