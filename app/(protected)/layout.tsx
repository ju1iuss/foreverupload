'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UserInfo {
  authenticated: boolean;
  username?: string;
  profileImage?: string;
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo>({ authenticated: false });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

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
            background: '#FF006F', 
            boxShadow: '0 0 10px #FF006F'
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
        {children}
      </main>
    </div>
  );
}

