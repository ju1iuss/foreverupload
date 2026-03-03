'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from './Button';

interface UserInfo {
  authenticated: boolean;
  username?: string;
  profileImage?: string;
}

interface SidebarProps {
  userInfo: UserInfo;
  loading: boolean;
  onConnect: () => void;
}

export default function Sidebar({ userInfo, loading, onConnect }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: 'Calendar',
      path: '/calendar',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
            clipRule="evenodd"
            fill="currentColor"
          />
        </svg>
      ),
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
            clipRule="evenodd"
            fill="currentColor"
          />
        </svg>
      ),
    },
  ];

  // Aggressively prefetch all routes on mount for instant navigation
  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/calendar');
    router.prefetch('/settings');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname?.startsWith(path);
  };

  return (
    <div
      style={{
        width: '240px',
        height: '100vh',
        background: '#191919',
        borderRight: '1px solid #252525',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 'max(2rem, calc(50vw - 520px))',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img
            src="/logo.png"
            alt="ForeverUpload"
            style={{
              height: '32px',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d2ccc6' }}>
            ForeverUpload
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: '1rem 0.5rem',
          overflowY: 'auto',
        }}
      >
        {menuItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                marginBottom: '0.25rem',
                borderRadius: '8px',
                color: active ? '#d2ccc6' : '#999',
                background: active ? '#252525' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9375rem',
                fontWeight: active ? 600 : 400,
                transition: 'all 0.1s ease', // Faster transition
                cursor: 'pointer',
                position: 'relative',
              }}
              prefetch={true}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#252525';
                  e.currentTarget.style.color = '#ccc';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#999';
                }
              }}
            >
              {active && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '20%',
                    height: '60%',
                    width: '3px',
                    background: '#4A90E2',
                    borderRadius: '0 4px 4px 0',
                  }}
                />
              )}
              <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Connect Section */}
      <div
        style={{
          padding: '1rem',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: '0.75rem',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.875rem',
            }}
          >
            Loading...
          </div>
        ) : userInfo.authenticated ? (
          <div
            style={{
              padding: '0.75rem',
              background: '#252525',
              borderRadius: '8px',
              border: '1px solid #2a2a2a',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.25rem',
                marginBottom: '0.5rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: '#999',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Connected
                </span>
              </div>
              <Link
                href="/settings"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  color: '#999',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#2a2a2a';
                  e.currentTarget.style.color = '#d2ccc6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#999';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    fillRule="evenodd"
                    d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                    clipRule="evenodd"
                    fill="currentColor"
                  />
                </svg>
              </Link>
            </div>
            {userInfo.profileImage && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <img
                  src={userInfo.profileImage}
                  alt={userInfo.username}
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <span
                  style={{
                    color: '#d2ccc6',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  {userInfo.username ? `@${userInfo.username}` : 'Pinterest'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <Button onClick={onConnect} fullWidth variant="primary">
            Connect Pinterest
          </Button>
        )}
        
        {/* Privacy Policy Link */}
        <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.75rem',
              color: '#666',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#999';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#666';
            }}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}

