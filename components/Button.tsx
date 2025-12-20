'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyles: React.CSSProperties = {
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '8px',
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    ...(fullWidth && { width: '100%' }),
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: disabled ? '#555' : '#4A90E2',
      color: '#d2ccc6',
    },
    secondary: {
      background: disabled ? '#2a2a2a' : '#252525',
      border: '1px solid #333',
      color: '#e0e0e0',
    },
    danger: {
      background: disabled ? '#555' : '#ef4444',
      color: '#d2ccc6',
    },
    ghost: {
      background: 'transparent',
      color: '#e0e0e0',
    },
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem',
    },
    md: {
      padding: '0.625rem 1.25rem',
      fontSize: '0.875rem',
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem',
    },
  };

  const hoverStyles = disabled
    ? {}
    : variant === 'primary'
      ? { background: '#357ABD' }
      : variant === 'secondary'
        ? { background: '#2a2a2a', borderColor: '#444' }
        : variant === 'danger'
          ? { background: '#dc2626' }
          : { background: '#252525' };

  return (
    <button
      disabled={disabled}
      style={{
        ...baseStyles,
        ...variantStyles[variant],
        ...sizeStyles[size],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, hoverStyles);
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = variantStyles[variant].background as string;
          if (variant === 'secondary') {
            e.currentTarget.style.borderColor = '#333';
          }
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
}

