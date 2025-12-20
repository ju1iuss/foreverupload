'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp, signIn, signInWithGoogle } from './actions';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [shouldSignUp, setShouldSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [ageConfirmed, setAgeConfirmed] = useState(false);

  const errorParam = searchParams.get('error');
  useEffect(() => {
    if (errorParam && !error) {
      setError(errorParam);
      // If error suggests sign up, switch to sign up mode
      if (errorParam.toLowerCase().includes('sign up') || errorParam.toLowerCase().includes('account')) {
        setShouldSignUp(true);
        setIsSignUp(true);
      }
    }
  }, [errorParam]);

  const handleGoogleSignIn = async () => {
    // Pinterest compliance: Require age confirmation before Google sign-in
    if (!ageConfirmed) {
      setError('You must confirm that you are 13 years or older to use this service.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await signInWithGoogle();
      if (result?.error) {
        setError(result.error);
      }
    });
  };

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    setSuccess(null);
    setShouldSignUp(false);

    // Age verification check
    if (!ageConfirmed) {
      setError('You must confirm that you are 13 years or older to use this service.');
      return;
    }

    startTransition(async () => {
      if (isSignUp) {
        const result = await signUp(formData);
        if (result.error) {
          setError(result.error);
          setShouldSignUp(false);
        } else {
          setSuccess(result.success || 'Success!');
          setShouldSignUp(false);
        }
      } else {
        const result = await signIn(formData);
        if (result?.error) {
          setError(result.error);
          // If user doesn't exist, suggest signing up
          if (result.shouldSignUp) {
            setShouldSignUp(true);
            setIsSignUp(true);
          } else {
            setShouldSignUp(false);
          }
        }
      }
    });
  };

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', maxWidth: '500px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#fff' }}>
          <span style={{ color: '#FF006F' }}>Pin</span>Upload
        </h1>
        <p style={{ color: '#666', fontSize: '0.9375rem' }}>
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>
      </header>

      <div
        style={{
          background: '#1a1a1a',
          border: '1px solid #333',
          borderRadius: '12px',
          padding: '2rem',
        }}
      >
        {error && (
          <div
            style={{
              background: '#ef4444',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          >
            {error}
            {shouldSignUp && isSignUp && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8125rem', opacity: 0.9 }}>
                We've switched you to sign up. Fill in your details below to create an account.
              </div>
            )}
          </div>
        )}

        {success && (
          <div
            style={{
              background: '#22c55e',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              marginBottom: '1rem',
              color: '#fff',
              fontSize: '0.875rem',
            }}
          >
            {success}
          </div>
        )}

        <form action={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#999',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={isPending}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#252525',
                border: '1px solid #333',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '0.9375rem',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#555';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#333';
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                color: '#999',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={isPending}
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem 2.5rem 0.75rem 0.75rem',
                  background: '#252525',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  color: '#fff',
                  fontSize: '0.9375rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#555';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#333';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isPending}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!isPending) {
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPending) {
                    e.currentTarget.style.color = '#999';
                  }
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 3.75c-3.75 0-6.875 2.25-8.75 6.25 1.875 4 4.375 6.25 8.75 6.25s6.875-2.25 8.75-6.25c-1.875-4-4.375-6.25-8.75-6.25z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2.5 2.5l15 15"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M10 3.75c-3.75 0-6.875 2.25-8.75 6.25 1.875 4 4.375 6.25 8.75 6.25s6.875-2.25 8.75-6.25c-1.875-4-4.375-6.25-8.75-6.25z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: '#999',
              }}
            >
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                style={{
                  marginTop: '0.125rem',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#FF006F',
                }}
              />
              <span>
                I confirm that I am 13 years of age or older and agree to the{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: '#FF006F',
                    textDecoration: 'underline',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Privacy Policy
                </a>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending || !ageConfirmed}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: isPending ? '#555' : '#FF006F',
              border: 'none',
              borderRadius: '6px',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.9375rem',
              cursor: isPending ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              marginBottom: '1rem',
            }}
            onMouseEnter={(e) => {
              if (!isPending) {
                e.currentTarget.style.background = '#e6005f';
              }
            }}
            onMouseLeave={(e) => {
              if (!isPending) {
                e.currentTarget.style.background = '#FF006F';
              }
            }}
          >
            {isPending ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={{ position: 'relative', margin: '1.5rem 0', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: '#333' }}></div>
          <span style={{ position: 'relative', background: '#1a1a1a', padding: '0 0.75rem', color: '#666', fontSize: '0.8125rem' }}>OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isPending || !ageConfirmed}
          style={{
            width: '100%',
            padding: '0.75rem',
            background: isPending || !ageConfirmed ? '#555' : '#fff',
            border: 'none',
            borderRadius: '6px',
            color: isPending || !ageConfirmed ? '#999' : '#000',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: isPending || !ageConfirmed ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'background 0.2s',
            marginBottom: '1rem',
            opacity: isPending || !ageConfirmed ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isPending && ageConfirmed) {
              e.currentTarget.style.background = '#f0f0f0';
            }
          }}
          onMouseLeave={(e) => {
            if (!isPending && ageConfirmed) {
              e.currentTarget.style.background = '#fff';
            }
          }}
          title={!ageConfirmed ? 'Please confirm you are 13+ years old' : ''}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
              setShouldSignUp(false);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#999',
              fontSize: '0.875rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.75rem', color: '#666' }}>
          By using PinUpload, you agree to our{' '}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#999',
              textDecoration: 'underline',
            }}
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
}

