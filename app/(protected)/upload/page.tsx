'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/ImageUploader';
import BulkEditor from '@/components/BulkEditor';
import Button from '@/components/Button';

interface UploadedImage {
  url: string;
  title: string;
  description: string;
  link: string;
  selected: boolean;
}

interface Board {
  id: string;
  name: string;
  privacy: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [boardId, setBoardId] = useState('');
  const [boards, setBoards] = useState<Board[]>([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [showCreateBoardModal, setShowCreateBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [newBoardPrivacy, setNewBoardPrivacy] = useState<'PUBLIC' | 'SECRET'>('PUBLIC');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  useEffect(() => {
    checkAuthAndFetchBoards();
  }, []);

  const checkAuthAndFetchBoards = async () => {
    setLoadingBoards(true);
    try {
      // Check authentication
      const userResponse = await fetch('/api/pinterest/user');

      if (!userResponse.ok) {
        console.error('Failed to check authentication:', userResponse.status);
        setIsAuthenticated(false);
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
        // If boards fetch fails, check auth again - connection might have been deleted
        if (boardsResponse.status === 401 || boardsResponse.status === 403) {
          const recheckResponse = await fetch('/api/pinterest/user');
          if (recheckResponse.ok) {
            const recheckData = await recheckResponse.json();
            if (!recheckData.authenticated) {
              setIsAuthenticated(false);
              setBoards([]);
              setLoadingBoards(false);
              return;
            }
          }
        }
        
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
      if (Array.isArray(boardsData)) {
        boardsList = boardsData;
      } else if (boardsData.items && Array.isArray(boardsData.items)) {
        boardsList = boardsData.items;
      } else if (boardsData.data && Array.isArray(boardsData.data)) {
        boardsList = boardsData.data;
      }

      // Map boards to expected format
      const formattedBoards = boardsList.map((board: any) => ({
        id: board.id || board.board_id,
        name: board.name || board.title || 'Unnamed Board',
        privacy: board.privacy || 'PUBLIC',
      }));

      setBoards(formattedBoards);
      // Don't auto-select - let user choose from dropdown
    } catch (error) {
      console.error('Error fetching boards:', error);
      setBoards([]);
    } finally {
      setLoadingBoards(false);
    }
  };

  const createBoard = async () => {
    if (!newBoardName.trim()) {
      alert('Please enter a board name');
      return;
    }
    
    setCreatingBoard(true);
    try {
      const response = await fetch('/api/pinterest/boards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newBoardName.trim(),
          description: newBoardDescription.trim(),
          privacy: newBoardPrivacy,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create board');
      }

      const data = await response.json();
      if (data.success && data.board) {
        const newBoard = {
          id: data.board.id,
          name: data.board.name,
          privacy: data.board.privacy || 'PUBLIC',
        };
        setBoards((prev) => [...prev, newBoard]);
        setBoardId(newBoard.id);
        setShowCreateBoardModal(false);
        setNewBoardName('');
        setNewBoardDescription('');
        setNewBoardPrivacy('PUBLIC');
      }
    } catch (error: any) {
      console.error('Error creating board:', error);
      alert(`Failed to create board: ${error.message}`);
    } finally {
      setCreatingBoard(false);
    }
  };

  const handleBoardSelect = (value: string) => {
    if (value === '__create_new__') {
      setShowCreateBoardModal(true);
      setDropdownOpen(false);
    } else {
      setBoardId(value);
      setDropdownOpen(false);
    }
  };

  const selectedBoard = boards.find((b) => b.id === boardId);

  const handleImageUploaded = (url: string) => {
    console.log('Image uploaded, URL received:', url);
    const newImage: UploadedImage = {
      url,
      title: '',
      description: '',
      link: '',
      selected: true,
    };
    setImages((prev) => [...prev, newImage]);
  };

  const handleUploadProgress = (uploaded: number, total: number) => {
    setUploadProgress({ uploaded, total });
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleBulkUpdate = (updates: { title?: string; description?: string; link?: string }) => {
    setImages(
      images.map((img) =>
        img.selected
          ? {
              ...img,
              title: updates.title !== undefined ? updates.title : img.title,
              description: updates.description !== undefined ? updates.description : img.description,
              link: updates.link !== undefined ? updates.link : img.link,
            }
          : img
      )
    );
  };

  const toggleSelect = (index: number) => {
    setImages(images.map((img, i) => (i === index ? { ...img, selected: !img.selected } : img)));
  };

  const handleConfirmSchedule = async () => {
    if (!boardId.trim()) {
      alert('Please select a board');
      return;
    }

    const selectedImages = images.filter((img) => img.selected);
    if (selectedImages.length === 0) {
      alert('Please select at least one image');
      return;
    }

    // Pinterest compliance: Confirm user has reviewed each pin
    const selectedBoard = boards.find((b) => b.id === boardId);
    const confirmMessage = 
      `You are about to add ${selectedImages.length} pin(s) to your content pool.\n\n` +
      `Board: ${selectedBoard?.name || boardId}\n\n` +
      `Please confirm that you have reviewed each pin's title, description, and link.\n\n` +
      `These pins will be queued for manual posting (max 6 per day).`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    setSaving(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to schedule pins');
        return;
      }

      // Get all pending posts for THIS user to calculate queue position
      const { data: pendingPosts } = await supabase
        .from('pin_scheduled')
        .select('created_at')
        .eq('status', 'pending')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);

      const currentPendingCount = pendingPosts?.length || 0;
      
      let baseCreatedAt: Date;
      if (currentPendingCount === 0) {
        baseCreatedAt = tomorrow;
      } else {
        const daysFromToday = Math.floor(currentPendingCount / 6);
        baseCreatedAt = new Date(tomorrow);
        baseCreatedAt.setDate(tomorrow.getDate() + daysFromToday);
        baseCreatedAt.setHours(8, 0, 0, 0);
      }

      // Create posts with user_id
      const pinsToCreate = selectedImages.map((img, index) => {
        const postDate = new Date(baseCreatedAt);
        const hourOffset = (currentPendingCount + index) % 6;
        postDate.setHours(8 + hourOffset, 0, 0, 0);
        
        return {
          user_id: user.id, // Set the user_id!
          image_url: img.url,
          title: img.title,
          description: img.description,
          board_id: boardId, // board_id is now required since we fetch from production API
          status: 'pending',
          created_at: postDate.toISOString(),
        };
      });

      const { error } = await supabase.from('pin_scheduled').insert(pinsToCreate);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      router.push('/content-pool');
      router.refresh();
    } catch (error: any) {
      console.error('Error scheduling pins:', error);
      const errorMessage = error?.message || error?.error_description || 'Failed to schedule pins. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
            Content
          </h1>
          <p style={{ color: '#666', fontSize: '0.9375rem' }}>
            Upload images and schedule them to be posted to Pinterest
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => {
              const input = document.getElementById('file-upload') as HTMLInputElement;
              input?.click();
            }}
            variant="primary"
            size="md"
          >
            Upload Assets
          </Button>
        )}
      </div>

      {!isAuthenticated && !loadingBoards ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            textAlign: 'center',
          }}
        >
          <Button
            onClick={() => {
              window.location.href = '/api/auth/pinterest';
            }}
            variant="primary"
            size="lg"
          >
            Connect Pinterest
          </Button>
        </div>
      ) : (
        <>
          <ImageUploader 
            onUpload={handleImageUploaded} 
            onProgress={handleUploadProgress}
            dragActive={dragActive}
            onDragChange={setDragActive}
          />
          
          {/* Example Images and Collections */}
          {images.length === 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#999', marginBottom: '0.75rem' }}>
                Example Collections
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[
                  { name: 'Food & Recipes', count: 12, color: '#ef4444' },
                  { name: 'Home Decor', count: 8, color: '#8b5cf6' },
                  { name: 'Fashion', count: 15, color: '#ec4899' },
                  { name: 'Travel', count: 10, color: '#06b6d4' },
                  { name: 'Fitness', count: 9, color: '#10b981' },
                  { name: 'DIY Projects', count: 7, color: '#f59e0b' },
                ].map((collection, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      // Add example images for this collection
                      const exampleImages = Array.from({ length: collection.count }, (_, i) => ({
                        url: `https://picsum.photos/400/600?random=${idx * 100 + i}`,
                        title: `${collection.name} ${i + 1}`,
                        description: `Beautiful ${collection.name.toLowerCase()} inspiration`,
                        link: '',
                        selected: true,
                      }));
                      setImages(exampleImages);
                    }}
                    style={{
                      background: '#252525',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      padding: '1rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = collection.color;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#333';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      right: 0, 
                      height: '4px', 
                      background: collection.color 
                    }} />
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                      {collection.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {collection.count} images
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {uploadProgress.total > 0 && uploadProgress.uploaded < uploadProgress.total && (
            <div style={{
              background: '#252525',
              border: '1px solid #333',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.875rem', color: '#e0e0e0', fontWeight: 500 }}>
                    Uploading images...
                  </span>
                  <span style={{ fontSize: '0.875rem', color: '#999' }}>
                    {uploadProgress.uploaded} / {uploadProgress.total}
                  </span>
                </div>
                <div style={{ 
                  width: '100%', 
                  height: '8px', 
                  background: '#191919', 
                  borderRadius: '4px', 
                  overflow: 'hidden' 
                }}>
                  <div style={{ 
                    width: `${(uploadProgress.uploaded / uploadProgress.total) * 100}%`, 
                    height: '100%', 
                    background: '#4A90E2',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          )}
          
          {/* Page-level drag handlers */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragActive(false);
              }
            }}
            style={{ minHeight: '100vh' }}
          >

          {images.length > 0 && (
            <>
              <div style={{ marginBottom: '1.5rem' }}>
                <BulkEditor onUpdate={handleBulkUpdate} selectedCount={images.filter((img) => img.selected).length} />
              </div>

              <div
                style={{
                  marginBottom: '120px', // Space for fixed bottom bar
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#999' }}>
                    Images ({images.length})
                  </h2>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {images.filter((img) => img.selected).length} selected
                    </span>
                    <Button
                      onClick={() => setImages(images.map((img) => ({ ...img, selected: true })))}
                      variant="secondary"
                      size="sm"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                    >
                      All
                    </Button>
                    <Button
                      onClick={() => setImages(images.map((img) => ({ ...img, selected: false })))}
                      variant="secondary"
                      size="sm"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                    >
                      None
                    </Button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => toggleSelect(idx)}
                      style={{
                        border: img.selected ? '2px solid #4A90E2' : '1px solid #333',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                        opacity: img.selected ? 1 : 0.7,
                      }}
                      onMouseEnter={(e) => {
                        if (!img.selected) {
                          e.currentTarget.style.borderColor = '#555';
                          e.currentTarget.style.opacity = '0.9';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!img.selected) {
                          e.currentTarget.style.borderColor = '#333';
                          e.currentTarget.style.opacity = '0.7';
                        }
                      }}
                    >
                      <img
                        src={img.url}
                        alt={`Upload ${idx + 1}`}
                        style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
                      />
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(idx);
                        }}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          width: '20px',
                          height: '20px',
                          background: img.selected ? '#4A90E2' : 'rgba(0, 0, 0, 0.4)',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          border: img.selected ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                        }}
                      >
                        {img.selected && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 'bold' }}>✓</span>}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        style={{
                          position: 'absolute',
                          top: '0.5rem',
                          left: '0.5rem',
                          width: '24px',
                          height: '24px',
                          padding: 0,
                          background: 'rgba(0, 0, 0, 0.6)',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                          color: '#999',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                          e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(0, 0, 0, 0.6)';
                          e.currentTarget.style.color = '#999';
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M3 6h14M8 6V4a2 2 0 012-2h0a2 2 0 012 2v2m3 0v10a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v4M6 11v4M14 11v4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      <div style={{ padding: '0.5rem' }}>
                        {img.title && (
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.2rem', color: '#fff' }}>
                            {img.title}
                          </div>
                        )}
                        {img.description && (
                          <div style={{ fontSize: '0.7rem', color: '#999', marginBottom: '0.2rem' }}>
                            {img.description.substring(0, 40)}...
                          </div>
                        )}
                        {img.link && (
                          <div style={{ fontSize: '0.65rem', color: '#666', marginBottom: '0.2rem', wordBreak: 'break-all' }}>
                            🔗 {img.link.substring(0, 25)}...
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Fixed Bottom Bar */}
          {images.length > 0 && (
            <div
              style={{
                position: 'fixed',
                bottom: 0,
                left: 'max(calc(240px + 2rem), calc(50vw - 280px))',
                width: '100%',
                maxWidth: '800px',
                background: '#191919',
                borderTop: '1px solid #333',
                padding: '0.75rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem',
                zIndex: 100,
              }}
            >
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, position: 'relative' }}>
                <div style={{ minWidth: '200px', position: 'relative' }}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={{
                      width: '100%',
                      padding: '0.375rem 0.5rem',
                      background: '#252525',
                      border: boardId ? '1px solid #333' : '1px solid #666',
                      borderRadius: '4px',
                      color: boardId ? '#e0e0e0' : '#999',
                      fontSize: '0.8125rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {loadingBoards ? 'Loading boards...' : selectedBoard ? `${selectedBoard.name} (${selectedBoard.privacy})` : 'Select a board'}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#666', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
                  </button>
                  
                  {dropdownOpen && (
                    <>
                      <div
                        onClick={() => setDropdownOpen(false)}
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 998,
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '100%',
                          left: 0,
                          right: 0,
                          marginBottom: '0.25rem',
                          background: '#252525',
                          border: '1px solid #333',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          zIndex: 999,
                          boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.3)',
                          maxHeight: '300px',
                          overflowY: 'auto',
                        }}
                      >
                        {boards.length === 0 && !loadingBoards && (
                          <div
                            style={{
                              padding: '0.75rem',
                              color: '#999',
                              fontSize: '0.8125rem',
                              textAlign: 'center',
                            }}
                          >
                            No boards found
                          </div>
                        )}
                        {boards.map((board) => (
                          <button
                            key={board.id}
                            type="button"
                            onClick={() => handleBoardSelect(board.id)}
                            style={{
                              width: '100%',
                              padding: '0.625rem 0.75rem',
                              background: boardId === board.id ? '#333' : 'transparent',
                              border: 'none',
                              color: '#e0e0e0',
                              fontSize: '0.8125rem',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              if (boardId !== board.id) {
                                e.currentTarget.style.background = '#2a2a2a';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (boardId !== board.id) {
                                e.currentTarget.style.background = 'transparent';
                              }
                            }}
                          >
                            <div style={{ fontWeight: boardId === board.id ? 600 : 400 }}>
                              {board.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.125rem' }}>
                              {board.privacy}
                            </div>
                          </button>
                        ))}
                        <div
                          style={{
                            borderTop: '1px solid #333',
                            marginTop: boards.length > 0 ? '0.25rem' : 0,
                            paddingTop: boards.length > 0 ? '0.25rem' : 0,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleBoardSelect('__create_new__')}
                            style={{
                              width: '100%',
                              padding: '0.625rem 0.75rem',
                              background: 'transparent',
                              border: 'none',
                              color: '#4A90E2',
                              fontSize: '0.8125rem',
                              fontWeight: 500,
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'background 0.2s',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#2a2a2a';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                            }}
                          >
                            + Create new board
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button onClick={() => router.back()} variant="secondary" size="sm" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSchedule}
                  disabled={
                    images.filter((img) => img.selected).length === 0 || 
                    !boardId.trim() ||
                    saving ||
                    images.filter((img) => img.selected).some((img) => !img.title || !img.title.trim())
                  }
                  variant="primary"
                  size="sm"
                  style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem', minWidth: '120px' }}
                >
                  {saving ? 'Adding...' : `Add to content pool (${images.filter((img) => img.selected).length})`}
                </Button>
              </div>
            </div>
          )}
          </div>
        </>
      )}

      {/* Create Board Modal */}
      {showCreateBoardModal && (
        <div
          onClick={() => setShowCreateBoardModal(false)}
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
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#191919',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '400px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid #333',
            }}
          >
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '1.5rem' }}>
              Create New Board
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 500 }}>Board Name *</span>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="e.g. My Recipes, Travel Inspiration..."
                  style={{
                    padding: '0.625rem 0.75rem',
                    background: '#252525',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#4A90E2';
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  autoFocus
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 500 }}>Description</span>
                <textarea
                  value={newBoardDescription}
                  onChange={(e) => setNewBoardDescription(e.target.value)}
                  placeholder="What's this board about?"
                  rows={3}
                  style={{
                    padding: '0.625rem 0.75rem',
                    background: '#252525',
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
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.outline = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 500 }}>Privacy</span>
                <select
                  value={newBoardPrivacy}
                  onChange={(e) => setNewBoardPrivacy(e.target.value as 'PUBLIC' | 'SECRET')}
                  style={{
                    padding: '0.625rem 0.75rem',
                    background: '#252525',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                >
                  <option value="PUBLIC">Public - Anyone can see this board</option>
                  <option value="SECRET">Secret - Only you can see this board</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowCreateBoardModal(false);
                  setNewBoardName('');
                  setNewBoardDescription('');
                  setNewBoardPrivacy('PUBLIC');
                }}
                style={{
                  padding: '0.625rem 1rem',
                  background: 'transparent',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#e0e0e0',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={createBoard}
                disabled={!newBoardName.trim() || creatingBoard}
                style={{
                  padding: '0.625rem 1.25rem',
                  background: !newBoardName.trim() || creatingBoard ? '#333' : '#4A90E2',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: !newBoardName.trim() || creatingBoard ? 'not-allowed' : 'pointer',
                  opacity: !newBoardName.trim() || creatingBoard ? 0.6 : 1,
                }}
              >
                {creatingBoard ? 'Creating...' : 'Create Board'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

