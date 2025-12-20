'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/app/auth/actions';

interface UserInfo {
  authenticated: boolean;
  username?: string;
  profileImage?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
    checkConnection();
  }, []);

  async function checkConnection() {
    try {
      const response = await fetch('/api/pinterest/user');
      
      const data = await response.json();
      setUserInfo(data || { authenticated: false });
    } catch (error) {
      console.error('Error checking connection:', error);
      setUserInfo({ authenticated: false });
    } finally {
      setLoading(false);
    }
  }

  const handleDisconnectClick = () => {
    setShowDisconnectConfirm(true);
  };

  const handleDisconnectConfirm = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch('/api/pinterest/disconnect', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to disconnect');
      }

      // Refresh connection state
      await checkConnection();
      setShowDisconnectConfirm(false);
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setDisconnecting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
          Settings
        </h1>
      </div>

      {/* Account Section */}
      <div
        style={{
          background: '#252525',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>
          Account
        </h2>
        {user && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.5rem' }}>Email</div>
            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 500 }}>{user.email}</div>
          </div>
        )}
        <form action={handleSignOut}>
          <button
            type="submit"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#ef4444',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '0.9375rem',
            }}
          >
            Sign Out
          </button>
        </form>
      </div>

      {/* Pinterest Connection Section */}
      <div
        style={{
          background: '#252525',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1.5rem', color: '#fff' }}>
          Pinterest Connection
        </h2>
        {loading ? (
          <div style={{ color: '#666', fontSize: '0.9375rem' }}>Loading...</div>
        ) : userInfo.authenticated ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              {userInfo.profileImage && (
                <img
                  src={userInfo.profileImage}
                  alt={userInfo.username}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
              )}
              <div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                  {userInfo.username ? `@${userInfo.username}` : 'Pinterest Account'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#22c55e',
                    }}
                  />
                  <span style={{ color: '#666', fontSize: '0.875rem' }}>Connected</span>
                </div>
              </div>
            </div>
            <Button onClick={handleDisconnectClick} variant="danger" size="md">
              Disconnect Account
            </Button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              No Pinterest account connected. Connect your account to start scheduling posts.
            </p>
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div
          onClick={() => !disconnecting && setShowDisconnectConfirm(false)}
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
              width: '100%',
              maxWidth: '500px',
              background: '#191919',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '1rem' }}>
              Disconnect Pinterest Account?
            </h2>
            <p style={{ fontSize: '1rem', color: '#e0e0e0', marginBottom: '2rem', lineHeight: '1.6' }}>
              Are you sure you want to disconnect your Pinterest account? This will stop all scheduled posts.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => setShowDisconnectConfirm(false)}
                variant="secondary"
                size="md"
                disabled={disconnecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDisconnectConfirm}
                variant="danger"
                size="md"
                disabled={disconnecting}
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

