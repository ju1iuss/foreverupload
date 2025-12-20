'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ImageUploaderProps {
  onUpload: (url: string) => void;
  onProgress?: (uploaded: number, total: number) => void;
  dragActive?: boolean;
  onDragChange?: (active: boolean) => void;
}

export default function ImageUploader({ onUpload, onProgress, dragActive = false, onDragChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, total: 0 });

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    setUploading(true);
    setUploadProgress({ uploaded: 0, total: fileArray.length });
    onProgress?.(0, fileArray.length);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    try {
      // Upload files one by one to show progress
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
          continue; // Skip failed files but continue with others
        }

        const data = await response.json();
        if (data.urls && data.urls.length > 0) {
          // Call onUpload for each completed upload
          onUpload(data.urls[0]);
          const uploaded = i + 1;
          setUploadProgress({ uploaded, total: fileArray.length });
          onProgress?.(uploaded, fileArray.length);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Failed to upload some images: ${error instanceof Error ? error.message : 'Unknown error'}. Check console for details.`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      onDragChange?.(true);
    } else if (e.type === 'dragleave') {
      onDragChange?.(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragChange?.(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  return (
    <>
      <input
        type="file"
        id="file-upload"
        multiple
        accept="image/*"
        onChange={(e) => handleUpload(e.target.files)}
        style={{ display: 'none' }}
        disabled={uploading}
      />
      {dragActive && (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            border: `4px dashed #4A90E2`,
            borderRadius: '8px',
            padding: '3rem',
            textAlign: 'center',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: uploading ? 'wait' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
              pointerEvents: uploading ? 'none' : 'auto',
            }}
          >
            <div style={{ fontSize: '4rem' }}>{uploading ? '⏳' : '📷'}</div>
            <div>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: uploading ? '#4A90E2' : '#fff', fontWeight: 600 }}>
                {uploading ? `Uploading images... (${uploadProgress.uploaded}/${uploadProgress.total})` : 'Drop images here'}
              </div>
              <div style={{ fontSize: '1rem', color: '#999' }}>
                {uploading ? 'Please wait while we process your files' : 'Release to upload'}
              </div>
              {uploading && uploadProgress.total > 0 && (
                <div style={{ marginTop: '1rem', width: '300px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '8px', 
                    background: '#333', 
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

