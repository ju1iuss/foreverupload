'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#191919' }}>
        <div style={{ color: '#666', fontSize: '0.9375rem' }}>Loading...</div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div style={{ minHeight: '100vh', background: '#191919', color: '#d2ccc6' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 2rem' }}>
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6rem' }}>
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
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d2ccc6' }}>
              ForeverUpload
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              href="/auth"
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#d2ccc6',
                fontWeight: 600,
                textDecoration: 'none',
                fontSize: '0.9375rem',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#555';
                e.currentTarget.style.background = '#1a1a1a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Log in
            </Link>
              <Link
                href="/auth"
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#4A90E2',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#d2ccc6',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.9375rem',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#357ABD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4A90E2';
                }}
              >
                Get Started
              </Link>
          </div>
        </header>

        {/* Hero Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center', marginBottom: '8rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, marginBottom: '1.5rem', lineHeight: '1.1' }}>
              Make <span style={{ background: '#4A90E2', padding: '0 0.25rem', borderRadius: '0', fontWeight: 800 }}>Pinterest</span> your most profitable marketing channel
            </h2>
            <p style={{ fontSize: '1rem', color: '#999', marginBottom: '3rem', maxWidth: '600px', lineHeight: '1.8' }}>
              Post content, see analytics, and plan your growth effortlessly. Schedule pins, track performance metrics, and optimize your Pinterest strategy all in one place.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '1.5rem', paddingTop: '1rem' }}>
              <Link
                href="/auth"
                style={{
                  padding: '1rem 2.5rem',
                  background: '#4A90E2',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#d2ccc6',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '1.125rem',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#357ABD';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#4A90E2';
                }}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
                </svg>
                Get Started Free
              </Link>
              
              {/* Social Proof Section */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i}
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        border: '2px solid #191919',
                        marginLeft: i === 1 ? '0' : '-12px',
                        background: '#333',
                        overflow: 'hidden'
                      }}
                    >
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} 
                        alt="User avatar"
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ display: 'flex', gap: '2px', color: '#FFB800', marginBottom: '2px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.875rem', color: '#999', margin: 0 }}>
                    <span style={{ fontWeight: 700, color: '#d2ccc6' }}>7,935</span> brands growing on Pinterest
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dashboard Image */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <img 
              src="/dashboard.png" 
              alt="ForeverUpload Dashboard Preview"
              style={{ 
                width: '100%', 
                maxWidth: '600px', 
                height: 'auto',
                borderRadius: '12px',
                border: '1px solid #333',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
              }}
            />
          </div>
        </div>

        {/* Features */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '8rem' }}>
          <FeatureCard
            title="Schedule Posts"
            description="Plan and draft your content in advance. Schedule pins for your chosen times to maintain consistency."
          />
          <FeatureCard
            title="Analytics Dashboard"
            description="Monitor your pin performance including impressions, saves, and clicks with detailed real-time data."
          />
          <FeatureCard
            title="Content Planning"
            description="Plan your pins in advance with a clear scheduling calendar to maintain consistency."
          />
        </div>

        {/* How it Works Section */}
        <div style={{ marginBottom: '8rem', textAlign: 'left' }}>
          <h3 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '4rem' }}>How it works</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem' }}>
            <div>
              <div style={{ color: '#4A90E2', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>01</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Connect Account</h4>
              <p style={{ color: '#999' }}>Securely link your Pinterest business account in seconds via our authorized API integration.</p>
            </div>
            <div>
              <div style={{ color: '#4A90E2', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>02</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Plan & Schedule</h4>
              <p style={{ color: '#999' }}>Upload your creative assets and plan your content calendar with ease.</p>
            </div>
            <div>
              <div style={{ color: '#4A90E2', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1rem' }}>03</div>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Analyze & Scale</h4>
              <p style={{ color: '#999' }}>Track performance metrics and optimize your strategy for maximum brand growth.</p>
            </div>
          </div>
        </div>

        {/* Why Pinterest Section */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', marginBottom: '8rem', alignItems: 'center' }}>
          <div style={{ textAlign: 'left' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: '1.2' }}>
              Why focus on Pinterest?
            </h3>
            <p style={{ fontSize: '1.125rem', color: '#999', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              Pinterest is a powerful visual discovery engine where users come specifically to find inspiration and make purchase decisions. 
              Unlike other platforms where content disappears in hours, Pins have a long shelf life, continuing to drive traffic for months.
            </p>
            <ul style={{ color: '#999', paddingLeft: '1.5rem', lineHeight: '2' }}>
              <li>High purchase intent audience</li>
              <li>Long-term organic traffic growth</li>
              <li>Visual-first brand storytelling</li>
              <li>Global reach and discovery</li>
            </ul>
          </div>
          <div style={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '16px', padding: '3rem', textAlign: 'center' }}>
            <div style={{ color: '#4A90E2', fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>450M+</div>
            <div style={{ color: '#d2ccc6', fontSize: '1.25rem', fontWeight: 600, marginBottom: '2rem' }}>Monthly Active Users</div>
            <div style={{ color: '#4A90E2', fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>80%</div>
            <div style={{ color: '#d2ccc6', fontSize: '1.25rem', fontWeight: 600 }}>Weekly Pinners discovering new brands</div>
          </div>
        </div>

        {/* CTA Section */}
        <div
          style={{
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '4rem 2rem',
            textAlign: 'center',
            marginBottom: '8rem',
          }}
        >
          <h3 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem' }}>
            Ready to grow your Pinterest presence?
          </h3>
          <p style={{ color: '#999', marginBottom: '2rem', fontSize: '1.125rem' }}>
            Join creators who plan and schedule their Pinterest content with ForeverUpload.
          </p>
          <Link
            href="/auth"
            style={{
              padding: '1rem 2rem',
              background: '#4A90E2',
              border: 'none',
              borderRadius: '8px',
              color: '#d2ccc6',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '1rem',
              display: 'inline-block',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#357ABD';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#4A90E2';
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* Footer */}
        <footer style={{ borderTop: '1px solid #333', padding: '4rem 0 2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <img
                  src="/logo.png"
                  alt="ForeverUpload"
                  style={{
                    height: '32px',
                    width: 'auto',
                    objectFit: 'contain',
                  }}
                />
                <span style={{ fontSize: '1.125rem', fontWeight: 700, color: '#d2ccc6' }}>
                  ForeverUpload
                </span>
              </div>
              <p style={{ color: '#666', fontSize: '0.875rem', lineHeight: '1.6' }}>
                The professional way to manage and grow your brand on Pinterest. Built for speed and reliability.
              </p>
            </div>
            <div>
              <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d2ccc6', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link href="/auth" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>Features</Link></li>
                <li><Link href="/auth" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>Analytics</Link></li>
                <li><Link href="/auth" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>Schedule</Link></li>
              </ul>
            </div>
            <div>
              <h5 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#d2ccc6', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Legal</h5>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <li><Link href="/imprint" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>Imprint</Link></li>
                <li><Link href="/privacy" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy Policy</Link></li>
                <li><Link href="/privacy" style={{ color: '#666', textDecoration: 'none', fontSize: '0.875rem' }}>Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '2rem', borderTop: '1px solid #222' }}>
            <p style={{ color: '#444', fontSize: '0.875rem' }}>&copy; {new Date().getFullYear()} ForeverUpload. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      style={{
        background: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '12px',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem', color: '#d2ccc6' }}>
        {title}
      </h3>
      <p style={{ color: '#999', fontSize: '0.9375rem', lineHeight: '1.6' }}>
        {description}
      </p>
    </div>
  );
}

