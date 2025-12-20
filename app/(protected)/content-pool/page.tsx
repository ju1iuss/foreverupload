'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ContentPoolView from '@/components/ContentPoolView';
import Button from '@/components/Button';
import ImageUploader from '@/components/ImageUploader';
import BulkEditor from '@/components/BulkEditor';
import { supabase } from '@/lib/supabase';

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

export default function ContentPoolPage() {
  const router = useRouter();
  const [pins, setPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
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
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showScheduleConfirmModal, setShowScheduleConfirmModal] = useState(false);
  const [pendingScheduleData, setPendingScheduleData] = useState<{ selectedImages: UploadedImage[]; boardId: string } | null>(null);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<{ title: string; description: string; link: string }>({ title: '', description: '', link: '' });
  const [editUrlError, setEditUrlError] = useState('');

  useEffect(() => {
    loadPins();
  }, []);

  // Reload when page becomes visible (handles back navigation)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPins();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Load boards when modal opens
  useEffect(() => {
    if (showUploadModal) {
      checkAuthAndFetchBoards();
    }
  }, [showUploadModal]);

  const checkAuthAndFetchBoards = async () => {
    setLoadingBoards(true);
    try {
      const userResponse = await fetch('/api/pinterest/user');
      if (!userResponse.ok) {
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
      const boardsResponse = await fetch('/api/pinterest/boards');
      if (!boardsResponse.ok) {
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
        setBoards([]);
        setLoadingBoards(false);
        return;
      }
      const boardsData = await boardsResponse.json();
      let boardsList = [];
      if (Array.isArray(boardsData)) {
        boardsList = boardsData;
      } else if (boardsData.items && Array.isArray(boardsData.items)) {
        boardsList = boardsData.items;
      } else if (boardsData.data && Array.isArray(boardsData.data)) {
        boardsList = boardsData.data;
      }
      const formattedBoards = boardsList.map((board: any) => ({
        id: board.id || board.board_id,
        name: board.name || board.title || 'Unnamed Board',
        privacy: board.privacy || 'PUBLIC',
      }));
      setBoards(formattedBoards);
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
    const newImage: UploadedImage = {
      url,
      title: '',
      description: '',
      link: '',
      selected: true,
    };
    setImages((prev) => [...prev, newImage]);
    // Open modal when first image is uploaded
    if (!showUploadModal) {
      setShowUploadModal(true);
      checkAuthAndFetchBoards();
    }
  };

  const handleUploadProgress = (uploaded: number, total: number) => {
    setUploadProgress({ uploaded, total });
    if (uploaded === total) {
      setUploadingFiles(false);
    }
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(true);
    setUploadProgress({ uploaded: 0, total: files.length });

    const fileArray = Array.from(files);
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    try {
      // Upload files one by one
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        const formData = new FormData();
        formData.append('files', file);

        const response = await fetch('/api/pinterest/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Upload failed for file ${i + 1}:`, errorText);
          continue;
        }

        const data = await response.json();
        if (data.urls && data.urls.length > 0) {
          handleImageUploaded(data.urls[0]);
          setUploadProgress({ uploaded: i + 1, total: fileArray.length });
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload some images: ${error instanceof Error ? error.message : 'Unknown error'}.`);
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      handleFileSelect(files);
    };
    input.click();
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

  const handleStartEdit = (index: number) => {
    const img = images[index];
    setEditingImageIndex(index);
    setEditFormData({
      title: img.title || '',
      description: img.description || '',
      link: img.link || '',
    });
    setEditUrlError('');
  };

  const handleSaveEdit = () => {
    if (editingImageIndex === null) return;
    
    const isValidUrl = (string: string): boolean => {
      try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (_) {
        return false;
      }
    };

    if (editFormData.link.trim() && !isValidUrl(editFormData.link.trim())) {
      setEditUrlError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }

    setEditUrlError('');
    setImages(images.map((img, i) => 
      i === editingImageIndex 
        ? {
            ...img,
            title: editFormData.title.trim(),
            description: editFormData.description.trim(),
            link: editFormData.link.trim(),
          }
        : img
    ));
    setEditingImageIndex(null);
    setEditFormData({ title: '', description: '', link: '' });
  };

  const handleCancelEdit = () => {
    setEditingImageIndex(null);
    setEditFormData({ title: '', description: '', link: '' });
    setEditUrlError('');
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
    // Show confirmation modal
    setPendingScheduleData({ selectedImages, boardId });
    setShowScheduleConfirmModal(true);
  };

  const handleScheduleConfirmed = async () => {
    if (!pendingScheduleData) return;
    
    const { selectedImages, boardId: confirmedBoardId } = pendingScheduleData;
    setSaving(true);
    setShowScheduleConfirmModal(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to schedule pins');
        return;
      }
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
      const pinsToCreate = pendingScheduleData.selectedImages.map((img, index) => {
        const postDate = new Date(baseCreatedAt);
        const hourOffset = (currentPendingCount + index) % 6;
        postDate.setHours(8 + hourOffset, 0, 0, 0);
        return {
          user_id: user.id,
          image_url: img.url,
          title: img.title,
          description: img.description,
          board_id: confirmedBoardId,
          status: 'pending',
          created_at: postDate.toISOString(),
        };
      });
      const { error } = await supabase.from('pin_scheduled').insert(pinsToCreate);
      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      setShowUploadModal(false);
      setImages([]);
      setBoardId('');
      loadPins();
    } catch (error: any) {
      console.error('Error scheduling pins:', error);
      const errorMessage = error?.message || error?.error_description || 'Failed to schedule pins. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
      setPendingScheduleData(null);
    }
  };

  const handleCloseModal = () => {
    setShowUploadModal(false);
    setImages([]);
    setBoardId('');
    setDragActive(false);
    setUploadProgress({ uploaded: 0, total: 0 });
  };

  async function loadPins() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('pin_scheduled')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPins(data || []);
    } catch (err) {
      console.error('Error loading pins:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
            Content Pool
          </h1>
          <p style={{ color: '#666', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
            All your Pinterest content in one place
          </p>
        </div>
        <Button variant="primary" size="md" onClick={handleUploadClick} disabled={uploadingFiles}>
          {uploadingFiles ? `Uploading... (${uploadProgress.uploaded}/${uploadProgress.total})` : 'Upload Content'}
        </Button>
      </div>

      {loading && pins.length === 0 ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#666' }}>
          Loading content...
        </div>
      ) : pins.length === 0 ? (
        <div style={{ 
          background: '#1a1a1a', 
          border: '1px solid #333', 
          borderRadius: '12px', 
          padding: '4rem', 
          textAlign: 'center' 
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem', color: '#fff' }}>
            No content yet
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Upload some images to start your content pool
          </p>
          <Button variant="primary" size="md" onClick={handleUploadClick} disabled={uploadingFiles}>
            {uploadingFiles ? `Uploading... (${uploadProgress.uploaded}/${uploadProgress.total})` : 'Upload Content'}
          </Button>
        </div>
      ) : (
        <div style={{ 
          background: '#252525', 
          border: '1px solid #333', 
          borderRadius: '12px', 
          padding: '1.5rem' 
        }}>
          <ContentPoolView pins={pins} onRefresh={loadPins} />
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
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
            zIndex: 1000,
            padding: '2rem',
            overflowY: 'auto',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.25rem' }}>
                  Upload Content
                </h2>
                <p style={{ color: '#666', fontSize: '0.875rem' }}>
                  Upload images and add them to your content pool
                </p>
              </div>
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
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </button>
            </div>

            {!isAuthenticated && !loadingBoards ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
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
              >
                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center' }}>
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
                  {images.length > 0 && images.filter((img) => img.selected).length > 0 && (
                    <BulkEditor onUpdate={handleBulkUpdate} selectedCount={images.filter((img) => img.selected).length} />
                  )}
                </div>
                <ImageUploader 
                  onUpload={handleImageUploaded} 
                  onProgress={handleUploadProgress}
                  dragActive={dragActive}
                  onDragChange={setDragActive}
                />
                
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

                {images.length > 0 && (
                  <>
                    <div style={{ marginBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#999' }}>
                          Images ({images.length})
                        </h3>
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
                            Deselect All
                          </Button>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem', maxHeight: '400px', overflowY: 'auto' }}>
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
                              style={{ width: '100%', height: '140px', objectFit: 'cover', display: 'block' }}
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(idx);
                              }}
                              style={{
                                position: 'absolute',
                                top: '0.5rem',
                                left: '2.5rem',
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
                                  d="M11.013 2.513a2.75 2.75 0 013.889 3.89L6.01 14.28a2.75 2.75 0 01-1.94.805l-2.57.038a.75.75 0 01-.75-.75l.038-2.57a2.75 2.75 0 01.805-1.94l8.893-8.892zM9.5 4.5l-5.5 5.5v2.5h2.5l5.5-5.5-2.5-2.5z"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            {(img.title || img.description || img.link) && (
                              <div style={{ padding: '0.5rem', borderTop: '1px solid #333' }}>
                                {img.title && (
                                  <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {img.title}
                                  </div>
                                )}
                                {img.description && (
                                  <div style={{ fontSize: '0.65rem', color: '#999', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {img.description}
                                  </div>
                                )}
                                {img.link && (
                                  <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    🔗 {img.link}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Bottom Bar */}
                {images.length > 0 && (
                  <div style={{
                    marginTop: 'auto',
                    paddingTop: '1.5rem',
                    borderTop: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}>
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
                                <div style={{ padding: '0.75rem', color: '#999', fontSize: '0.8125rem', textAlign: 'center' }}>
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
                              <div style={{ borderTop: '1px solid #333', marginTop: boards.length > 0 ? '0.25rem' : 0, paddingTop: boards.length > 0 ? '0.25rem' : 0 }}>
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
                      <Button onClick={handleCloseModal} variant="secondary" size="sm" style={{ fontSize: '0.8125rem', padding: '0.375rem 0.75rem' }}>
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
            )}
          </div>
        </div>
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
              maxWidth: '400px',
              padding: '1.5rem',
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
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
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
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
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

      {/* Schedule Confirmation Modal */}
      {showScheduleConfirmModal && pendingScheduleData && (
        <div
          onClick={() => setShowScheduleConfirmModal(false)}
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
            zIndex: 10000,
            padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
              Add to Content Pool
            </h2>
            
            <div>
              <p style={{ fontSize: '1rem', color: '#e0e0e0', marginBottom: '1.5rem' }}>
                You are about to add {pendingScheduleData.selectedImages.length} pin(s) to your content pool.
              </p>
              
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Board
                </div>
                <div style={{ fontSize: '1rem', color: '#fff' }}>
                  {boards.find((b) => b.id === pendingScheduleData.boardId)?.name || pendingScheduleData.boardId}
                </div>
              </div>
              
              <p style={{ fontSize: '0.9375rem', color: '#999', marginBottom: '0.75rem', lineHeight: '1.6' }}>
                Please confirm that you have reviewed each pin's title, description, and link.
              </p>
              
              <p style={{ fontSize: '0.9375rem', color: '#999', lineHeight: '1.6' }}>
                These pins will be queued for manual posting (max 6 per day).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <Button
                onClick={() => {
                  setShowScheduleConfirmModal(false);
                  setPendingScheduleData(null);
                }}
                variant="secondary"
                size="md"
                style={{ fontSize: '0.9375rem', padding: '0.625rem 1.25rem' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleScheduleConfirmed}
                variant="primary"
                size="md"
                style={{ fontSize: '0.9375rem', padding: '0.625rem 1.25rem' }}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Image Modal */}
      {editingImageIndex !== null && (
        <div
          onClick={handleCancelEdit}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>
                Edit Image
              </h2>
              <button
                onClick={handleCancelEdit}
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
                  e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#999';
                }}
              >
                ×
              </button>
            </div>

            {editingImageIndex !== null && images[editingImageIndex] && (
              <div style={{ marginBottom: '1.5rem' }}>
                <img
                  src={images[editingImageIndex].url}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                    background: '#252525',
                    marginBottom: '1rem',
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 500 }}>Title <span style={{ color: '#ef4444' }}>*</span></span>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  placeholder="Enter title"
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
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                  }}
                  autoFocus
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 500 }}>Description</span>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  placeholder="Enter description"
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
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                  }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.75rem', color: '#999', fontWeight: 500 }}>Link</span>
                <input
                  type="url"
                  value={editFormData.link}
                  onChange={(e) => {
                    setEditFormData({ ...editFormData, link: e.target.value });
                    if (editUrlError) setEditUrlError('');
                  }}
                  placeholder="https://..."
                  style={{
                    padding: '0.625rem 0.75rem',
                    background: '#252525',
                    border: editUrlError ? '1px solid #ef4444' : '1px solid #333',
                    borderRadius: '6px',
                    color: '#e0e0e0',
                    fontSize: '0.875rem',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = editUrlError ? '#ef4444' : '#4A90E2';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = editUrlError ? '#ef4444' : '#333';
                  }}
                />
                {editUrlError && (
                  <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '0.25rem' }}>
                    {editUrlError}
                  </div>
                )}
              </label>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={handleCancelEdit}
                variant="secondary"
                size="sm"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                variant="primary"
                size="sm"
                style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

