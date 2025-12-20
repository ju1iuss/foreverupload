'use client';

import { useState } from 'react';

export interface Pin {
  id: string;
  image_url: string;
  title: string | null;
  description: string | null;
  scheduled_at?: string;
  created_at: string;
  status: 'pending' | 'posted' | 'failed';
  posted_at: string | null;
  pin_id?: string | null;
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
  canPost?: boolean;
}

export function PinCard({ pin, allPins, onPostNow, onDelete, formatTime, getDateLabel, getStatusColor, currentlyViewedPinId, onSetViewedPin, onNavigate, canPost = true }: PinCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [localStatus, setLocalStatus] = useState(pin.status);
  const showQuickView = currentlyViewedPinId === pin.id;

  // Sync local status with pin prop
  if (pin.status !== localStatus && !isPosting && !postSuccess) {
    setLocalStatus(pin.status);
  }

  const handlePostClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPosting || postSuccess || localStatus === 'posted') return;
    
    setIsPosting(true);
    setPostSuccess(false);
    try {
      const success = await onPostNow(pin);
      if (success) {
        setPostSuccess(true);
        setLocalStatus('posted');
        setTimeout(() => {
          onSetViewedPin(null); // Close modal after success
        }, 1500);
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
          border: localStatus === 'posted' ? '1px solid #22c55e' : '1px solid #333',
          borderRadius: '3px',
          overflow: 'hidden',
          fontSize: '0.5rem',
          position: 'relative',
          aspectRatio: '1',
          cursor: 'pointer',
          transition: 'border-color 0.3s ease',
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
              padding: '0.25rem',
              color: '#d2ccc6',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginBottom: '0.1rem' }}>
              <div
                style={{
                  width: '4px',
                  height: '4px',
                  borderRadius: '50%',
                  background: getStatusColor(localStatus),
                  flexShrink: 0,
                  transition: 'background 0.3s ease',
                }}
              />
            </div>
            {pin.title && (
              <div style={{ fontSize: '0.5rem', fontWeight: 500, lineHeight: '1.1', marginTop: '0.1rem' }}>
                {pin.title.substring(0, 30)}{pin.title.length > 30 ? '...' : ''}
              </div>
            )}
            {pin.status === 'posted' && pin.posted_at && (
              <div style={{ fontSize: '0.4rem', color: '#999', marginTop: '0.1rem' }}>
                {new Date(pin.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
            top: '0.15rem',
            left: '0.15rem',
            padding: '0.15rem',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '2px',
            color: '#d2ccc6',
            fontSize: '0.5rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            lineHeight: 1,
          }}
          title="View details"
        >
          ⛶
        </button>
      )}
      {/* Pinterest icon button for posted pins - only visible on hover */}
      {isHovered && pin.status === 'posted' && pin.pin_id && (
        <a
          href={`https://www.pinterest.com/pin/${pin.pin_id}/`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '0.15rem',
            right: '0.15rem',
            padding: '0.15rem',
            background: 'rgba(0, 0, 0, 0.7)',
            border: 'none',
            borderRadius: '2px',
            color: '#d2ccc6',
            fontSize: '0.5rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '14px',
            height: '14px',
            lineHeight: 1,
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="View on Pinterest"
        >
          📌
        </a>
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
            width: '90%',
            maxWidth: '1000px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'row',
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

          {/* Image Container - Left Side */}
          <div style={{
            flex: '1.2',
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
          }}>
            <img
              src={pin.image_url}
              alt={pin.title || 'Pin image'}
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* Details Container - Right Side */}
          <div style={{
            flex: '0.8',
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            borderLeft: '1px solid #333',
            background: '#191919',
            overflowY: 'auto',
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: postSuccess ? '#22c55e' : getStatusColor(localStatus),
                    transition: 'background 0.3s ease',
                  }}
                />
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: postSuccess ? '#22c55e' : getStatusColor(localStatus),
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'color 0.3s ease',
                }}>
                  {postSuccess ? 'posted' : localStatus}
                </span>
              </div>
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                color: '#d2ccc6',
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                {pin.title || 'Untitled Post'}
              </h2>
              <p style={{
                fontSize: '1.05rem',
                color: '#aaa',
                lineHeight: '1.6',
                marginBottom: '1.5rem',
                whiteSpace: 'pre-wrap'
              }}>
                {pin.description || 'No description provided.'}
              </p>
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
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {localStatus !== 'posted' && (
                <button
                  onClick={handlePostClick}
                  disabled={isPosting || postSuccess || !canPost}
                  style={{
                    padding: '1rem',
                    background: !canPost ? '#666' : postSuccess ? '#22c55e' : '#4A90E2',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#d2ccc6',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isPosting || postSuccess || !canPost ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: '52px',
                    animation: postSuccess ? 'pulse-success 0.6s ease-in-out' : 'none',
                    opacity: !canPost ? 0.6 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isPosting && !postSuccess && canPost) e.currentTarget.style.background = '#357ABD';
                  }}
                  onMouseLeave={(e) => {
                    if (!isPosting && !postSuccess && canPost) e.currentTarget.style.background = '#4A90E2';
                  }}
                  title={!canPost ? 'Daily limit reached (6 posts/day)' : ''}
                >
                  {postSuccess ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        animation: 'checkmark-pop 0.4s ease-out forwards'
                      }}>✓</span>
                      Posted Successfully!
                    </span>
                  ) : isPosting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        border: '3px solid rgba(255, 255, 255, 0.2)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        animation: 'spin 0.7s linear infinite'
                      }} />
                      <span>Posting to Pinterest...</span>
                    </span>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                      </svg>
                      Post Now
                    </>
                  )}
                </button>
              )}
              {localStatus === 'posted' && pin.pin_id && (
                <a
                  href={`https://www.pinterest.com/pin/${pin.pin_id}/`}
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
                    e.currentTarget.style.background = '#252525';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#252525';
                  }}
                >
                  <span>View on Pinterest</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </a>
              )}
              {localStatus !== 'posted' && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

