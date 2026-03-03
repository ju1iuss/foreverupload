'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import Button from '@/components/Button';

interface UserInfo {
  authenticated: boolean;
  username?: string;
  profileImage?: string;
}

const PinterestContext = createContext<UserInfo>({ authenticated: false });
export const usePinterest = () => useContext(PinterestContext);

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [userInfo, setUserInfo] = useState<UserInfo>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const [pinterestChecked, setPinterestChecked] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  
  // Pages that require Pinterest connection
  const requiresPinterest = pathname === '/dashboard' || pathname === '/calendar';

  useEffect(() => {
    let mounted = true;
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        if (error || !session?.user) {
          setLoading(false);
          router.replace('/auth');
          return;
        }
        
        setUser(session.user);
        checkPinterestConnection(session.access_token);
        setLoading(false); // Stop loading ONLY after we have a user
      } catch (err) {
        console.error('Auth check error:', err);
        if (mounted) {
          router.replace('/auth');
        }
      }
    };
    
    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_OUT' || !session) {
        router.replace('/auth');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session.user);
        setLoading(false);
        checkPinterestConnection(session.access_token);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  async function checkPinterestConnection(token?: string) {
    try {
      const response = await fetch('/api/pinterest/user');
      
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data || { authenticated: false });
      } else {
        setUserInfo({ authenticated: false });
      }
    } catch (error) {
      console.error('Error checking Pinterest connection:', error);
      setUserInfo({ authenticated: false });
    } finally {
      setPinterestChecked(true);
    }
  }

  const handleConnect = async () => {
    window.location.href = '/api/auth/pinterest';
  };

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '100vh', background: '#191919', zIndex: 9999 }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#252525' }}>
          <div className="loading-bar-animation" style={{ 
            height: '100%', 
            background: '#4A90E2', 
            boxShadow: '0 0 10px #4A90E2'
          }} />
        </div>
        <style>{`
          @keyframes loading-bar {
            0% { width: 0%; left: 0%; }
            50% { width: 40%; left: 30%; }
            100% { width: 0%; left: 100%; }
          }
          .loading-bar-animation {
            position: absolute;
            animation: loading-bar 1.5s infinite linear;
          }
        `}</style>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <PinterestContext.Provider value={userInfo}>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#191919' }}>
        <Sidebar userInfo={userInfo} loading={false} onConnect={handleConnect} />
        <main
          style={{
            marginLeft: 'max(calc(240px + 2rem), calc(50vw - 280px))',
            minHeight: '100vh',
            padding: '2rem',
            maxWidth: '800px',
            width: '100%',
            background: '#191919',
            borderRight: '1px solid #333',
            position: 'relative',
            zIndex: 1000,
          }}
        >
          {requiresPinterest && pinterestChecked && !userInfo.authenticated ? (
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
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  marginBottom: '1.5rem',
                  background: '#252525',
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    fill="#4A90E2"
                  />
                </svg>
              </div>
              <h2
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  color: '#d2ccc6',
                }}
              >
                Connect Pinterest to Continue
              </h2>
              <p
                style={{
                  color: '#666',
                  fontSize: '0.9375rem',
                  marginBottom: '2rem',
                  maxWidth: '400px',
                }}
              >
                You need to connect your Pinterest account to access this page. Connect now to start managing your pins.
              </p>
              <Button onClick={handleConnect} variant="primary" size="lg">
                Connect Pinterest
              </Button>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </PinterestContext.Provider>
  );
}

