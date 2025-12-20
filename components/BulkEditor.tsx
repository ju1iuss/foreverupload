'use client';

import { useState } from 'react';
import Button from './Button';

interface BulkEditorProps {
  onUpdate: (updates: { title?: string; description?: string; link?: string }) => void;
  selectedCount: number;
}

export default function BulkEditor({ onUpdate, selectedCount }: BulkEditorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<{ title?: string; description?: string; link?: string } | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [urlError, setUrlError] = useState('');

  const isValidUrl = (string: string): boolean => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const handleApply = () => {
    // Validate link if provided
    if (link.trim() && !isValidUrl(link.trim())) {
      setUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setUrlError('');

    // Prepare updates
    const updates: { title?: string; description?: string; link?: string } = {};
    if (title.trim()) updates.title = title;
    if (description.trim()) updates.description = description;
    if (link.trim() && isValidUrl(link.trim())) {
      updates.link = link.trim();
    }

    // Show confirmation modal
    setPendingUpdates(updates);
    setShowConfirmModal(true);
  };

  const handleConfirmApply = () => {
    if (pendingUpdates) {
      onUpdate(pendingUpdates);
      setTitle('');
      setDescription('');
      setLink('');
    }
    setShowConfirmModal(false);
    setPendingUpdates(null);
    setIsExpanded(false);
  };

  const handleCancelApply = () => {
    setShowConfirmModal(false);
    setPendingUpdates(null);
  };

  const handleCloseModal = () => {
    setIsExpanded(false);
    setTitle('');
    setDescription('');
    setLink('');
    setUrlError('');
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setIsExpanded(true)}
        variant="secondary"
        size="md"
      >
        Bulk Edit ({selectedCount} selected)
      </Button>

      {/* Bulk Edit Modal */}
      {isExpanded && (
        <div
          onClick={handleCloseModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d2ccc6', marginBottom: '0.25rem' }}>
                Bulk Edit ({selectedCount} selected)
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  lineHeight: 1,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#d2ccc6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Title <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title"
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: '#191919',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.outline = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: '#191919',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.outline = 'none';
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Link
                </label>
                <input
                  type="url"
                  value={link}
                  onChange={(e) => {
                    setLink(e.target.value);
                    if (urlError) setUrlError('');
                  }}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.75rem',
                    background: '#191919',
                    border: urlError ? '1px solid #ef4444' : '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = urlError ? '#ef4444' : '#4A90E2';
                    e.currentTarget.style.outline = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = urlError ? '#ef4444' : '#333';
                    e.currentTarget.style.outline = 'none';
                  }}
                />
                {urlError && (
                  <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.5rem' }}>
                    {urlError}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCloseModal}
                variant="secondary"
                size="sm"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApply}
                variant="primary"
                size="sm"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Apply ({selectedCount})
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div
          onClick={handleCancelApply}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '500px',
              padding: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d2ccc6', marginBottom: '1rem' }}>
              Apply Changes
            </h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9375rem', color: '#e0e0e0', marginBottom: '1rem' }}>
                Apply these changes to {selectedCount} selected image(s)?
              </p>
              
              <div style={{ 
                background: '#252525', 
                border: '1px solid #333', 
                borderRadius: '8px', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {pendingUpdates?.title && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem', fontWeight: 500 }}>
                      Title
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#d2ccc6' }}>
                      {pendingUpdates.title}
                    </div>
                  </div>
                )}
                {pendingUpdates?.description && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem', fontWeight: 500 }}>
                      Description
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#d2ccc6' }}>
                      {pendingUpdates.description}
                    </div>
                  </div>
                )}
                {pendingUpdates?.link && (
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem', fontWeight: 500 }}>
                      Link
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4A90E2', wordBreak: 'break-all' }}>
                      {pendingUpdates.link}
                    </div>
                  </div>
                )}
              </div>
              
              <p style={{ fontSize: '0.8125rem', color: '#999', marginTop: '1rem' }}>
                You can review each pin individually before scheduling.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCancelApply}
                variant="secondary"
                size="sm"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmApply}
                variant="primary"
                size="sm"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

