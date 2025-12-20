'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarView from '@/components/CalendarView';
import Button from '@/components/Button';
import { supabase } from '@/lib/supabase';

export default function CalendarPage() {
  const router = useRouter();
  const [scheduledPins, setScheduledPins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduledPins();
  }, []);

  async function loadScheduledPins() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pin_scheduled')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setScheduledPins(data || []);
    } catch (err) {
      console.error('Error loading pins:', err);
      // Still try to load pins even if there's an error
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('pin_scheduled')
        .select('*')
        .order('created_at', { ascending: true });
      if (!fallbackError && fallbackData) {
        setScheduledPins(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSchedulePost = () => {
    router.push('/upload');
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
            Content Calendar
          </h1>
          <p style={{ color: '#666', fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
            Overview of your scheduled Pinterest posts
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button onClick={handleSchedulePost} variant="primary" size="md">
            + Add to calendar
          </Button>
        </div>
      </div>

      {loading && scheduledPins.length === 0 ? (
        <div
          style={{
            padding: '4rem',
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9375rem',
          }}
        >
          Loading calendar...
        </div>
      ) : scheduledPins.length === 0 ? (
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '4rem',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 1.5rem',
              background: '#222',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                fill="#666"
              />
            </svg>
          </div>
          <h2
            style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
              color: '#fff',
            }}
          >
            No scheduled posts yet
          </h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            Start scheduling your Pinterest content to see it here
          </p>
          <Button onClick={handleSchedulePost} variant="primary" size="md">
            Add to calendar
          </Button>
        </div>
      ) : (
        <>
          <div
            style={{
              background: '#252525',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <CalendarView pins={scheduledPins} onRefresh={loadScheduledPins} />
          </div>
        </>
      )}
    </div>
  );
}

