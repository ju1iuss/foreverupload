'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import BulkEditor from '@/components/BulkEditor';

interface UploadedImage {
  url: string;
  title: string;
  description: string;
  selected: boolean;
}

interface Board {
  id: string;
  name: string;
  privacy: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
  });
  const [boardId, setBoardId] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkAuthAndFetchBoards();
  }, []);

  const checkAuthAndFetchBoards = async () => {
    try {
      // Check authentication
      const userResponse = await fetch('/api/pinterest/user');

      if (!userResponse.ok) {
        console.error('Failed to check authentication:', userResponse.status);
        setLoadingBoards(false);
        return;
      }

      const userData = await userResponse.json();
      setIsAuthenticated(userData.authenticated);

      if (!userData.authenticated) {
        setLoadingBoards(false);
        return;
      }

      // Fetch boards
      const boardsResponse = await fetch('/api/pinterest/boards');

      if (!boardsResponse.ok) {
        let errorData: any = {};
        try {
          const errorText = await boardsResponse.text();
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || `HTTP ${boardsResponse.status}` };
            }
          } else {
            errorData = { error: `HTTP ${boardsResponse.status}: Empty response` };
          }
        } catch (e) {
          errorData = { error: `HTTP ${boardsResponse.status}: Failed to read error response` };
        }
        console.error('Failed to fetch boards:', errorData);
        setBoards([]);
        setLoadingBoards(false);
        return;
      }

      const boardsData = await boardsResponse.json();
      
      // Handle different response formats
      let boardsList = [];
      if (Array.isArray(boardsData.items)) {
        boardsList = boardsData.items;
      } else if (Array.isArray(boardsData)) {
        boardsList = boardsData;
      }

      // Map boards to expected format
      const formattedBoards = boardsList.map((board: any) => ({
        id: board.id || board.board_id,
        name: board.name || board.title || 'Unnamed Board',
        privacy: board.privacy || 'PUBLIC',
      }));

      setBoards(formattedBoards);
      if (formattedBoards.length > 0) {
        setBoardId(formattedBoards[0].id);
      }
    } catch (error) {
      console.error('Error fetching boards:', error);
      setBoards([]);
    } finally {
      setLoadingBoards(false);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/auth/pinterest';
  };

  const handleImagesUploaded = (url: string) => {
    const newImage = {
      url,
      title: '',
      description: '',
      selected: true,
    };
    setImages([...images, newImage]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleBulkUpdate = (updates: { title?: string; description?: string }) => {
    setImages(
      images.map((img) =>
        img.selected
          ? {
              ...img,
              title: updates.title !== undefined ? updates.title : img.title,
              description: updates.description !== undefined ? updates.description : img.description,
            }
          : img
      )
    );
  };

  const toggleSelect = (index: number) => {
    setImages(images.map((img, i) => (i === index ? { ...img, selected: !img.selected } : img)));
  };

  const generateScheduleTimes = (date: string, count: number) => {
    const times = [];
    const startHour = 8;
    const endHour = 17;
    const totalHours = endHour - startHour;
    const interval = totalHours / count;

    for (let i = 0; i < count; i++) {
      const hour = Math.floor(startHour + i * interval);
      const minute = Math.floor((i * interval - Math.floor(i * interval)) * 60);
      const scheduledDate = new Date(`${date}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);
      times.push(scheduledDate.toISOString());
    }

    return times;
  };

  const handleConfirmSchedule = async () => {
    if (!isAuthenticated) {
      alert('Please connect your Pinterest account first');
      return;
    }

    if (!boardId.trim()) {
      alert('Please select a board');
      return;
    }

    const selectedImages = images.filter((img) => img.selected);
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    setSaving(true);

    try {
      const scheduleTimes = generateScheduleTimes(selectedDate, Math.min(selectedImages.length, 8));

      const pinsToCreate = selectedImages.slice(0, 8).map((img, idx) => ({
        image_url: img.url,
        title: img.title,
        description: img.description,
        board_id: boardId,
        scheduled_at: scheduleTimes[idx] || scheduleTimes[scheduleTimes.length - 1],
        status: 'pending',
      }));

      const { error } = await supabase.from('pin_scheduled').insert(pinsToCreate);

      if (error) throw error;

      router.push('/');
    } catch (error) {
      console.error('Error scheduling pins:', error);
      alert('Failed to schedule pins. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>Schedule Posts</h1>
        
        {!isAuthenticated ? (
          <div
            style={{
              padding: '2rem',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <p style={{ marginBottom: '1rem', color: '#999' }}>
              You need to connect your Pinterest account before scheduling posts.
            </p>
            <button
              onClick={handleConnect}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#e60023',
                border: 'none',
                borderRadius: '24px',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Connect Pinterest Account
            </button>
          </div>
        ) : (
          <>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.875rem', color: '#999' }}>Schedule Date</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                padding: '0.5rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#999' }}>Board</span>
                {loadingBoards ? (
                  <div
                    style={{
                      padding: '0.5rem',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#999',
                      minWidth: '200px',
                    }}
                  >
                    Loading boards...
                  </div>
                ) : boards.length === 0 ? (
                  <div
                    style={{
                      padding: '0.5rem',
                      background: '#1a1a1a',
                      border: '1px solid #333',
                      borderRadius: '6px',
                      color: '#999',
                      minWidth: '200px',
                    }}
                  >
                    No boards found
                  </div>
                ) : (
                  <select
              value={boardId}
              onChange={(e) => setBoardId(e.target.value)}
              style={{
                padding: '0.5rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#e0e0e0',
                minWidth: '200px',
              }}
                  >
                    {boards.map((board) => (
                      <option key={board.id} value={board.id}>
                        {board.name} ({board.privacy})
                      </option>
                    ))}
                  </select>
                )}
          </label>
        </div>
          </>
        )}
      </header>

      {isAuthenticated && (
        <>
      <ImageUploader onUpload={handleImagesUploaded} />

      {images.length > 0 && (
        <>
          <BulkEditor onUpdate={handleBulkUpdate} selectedCount={images.filter((img) => img.selected).length} />

          <div style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>Uploaded Images ({images.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {images.map((img, idx) => (
                <div
                  key={idx}
                  style={{
                    background: '#1a1a1a',
                    border: img.selected ? '2px solid #3b82f6' : '1px solid #333',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    position: 'relative',
                  }}
                >
                  <div
                    onClick={() => toggleSelect(idx)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      width: '24px',
                      height: '24px',
                      background: img.selected ? '#3b82f6' : '#333',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 10,
                    }}
                  >
                    {img.selected && <span style={{ color: '#fff', fontSize: '0.75rem' }}>✓</span>}
                  </div>
                  <img
                    src={img.url}
                    alt={`Upload ${idx + 1}`}
                    style={{ width: '100%', height: '200px', objectFit: 'cover', display: 'block' }}
                  />
                  <div style={{ padding: '0.75rem' }}>
                    {img.title && (
                      <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                        {img.title}
                      </div>
                    )}
                    {img.description && (
                      <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.5rem' }}>
                        {img.description.substring(0, 50)}...
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveImage(idx)}
                      style={{
                        padding: '0.25rem 0.5rem',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '0.75rem',
                        width: '100%',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#e0e0e0',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmSchedule}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#555' : '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                color: '#fff',
                fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Confirm Schedule'}
            </button>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}

