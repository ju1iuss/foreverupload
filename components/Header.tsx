'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface UserInfo {
  authenticated: boolean;
  username?: string;
  profileImage?: string;
}

export default function Header() {
  const [userInfo, setUserInfo] = useState<UserInfo>({ authenticated: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/pinterest/user');

      const data = await response.json();
      setUserInfo(data);
    } catch (error) {
      console.error('Error checking auth:', error);
      setUserInfo({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    window.location.href = '/api/auth/pinterest';
  };

  return (
    <header
      style={{
        background: '#1a1a1a',
        borderBottom: '1px solid #333',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="ForeverUpload"
            style={{
              height: '28px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
          <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#e0e0e0' }}>
            ForeverUpload
          </span>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link
            href="/"
            style={{
              color: '#999',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            Dashboard
          </Link>
          <Link
            href="/schedule"
            style={{
              color: '#999',
              textDecoration: 'none',
              fontSize: '0.875rem',
            }}
          >
            Schedule
          </Link>
        </nav>
      </div>

      <div>
        {loading ? (
          <div style={{ color: '#999', fontSize: '0.875rem' }}>Loading...</div>
        ) : userInfo.authenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {userInfo.profileImage && (
              <img
                src={userInfo.profileImage}
                alt={userInfo.username}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            )}
            <span style={{ color: '#e0e0e0', fontSize: '0.875rem' }}>@{userInfo.username}</span>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            style={{
              padding: '0.5rem 1rem',
              background: '#4A90E2',
              border: 'none',
              borderRadius: '24px',
              color: '#d2ccc6',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Connect Pinterest
          </button>
        )}
      </div>
    </header>
  );
}

