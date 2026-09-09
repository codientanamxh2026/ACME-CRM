'use client';

import React from 'react';

export default function Button({
  children,
  variant = 'primary', // primary | secondary | ghost | danger | success | icon
  size = 'md', // sm | md | lg
  icon = null,
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const baseClass = 'btn';
  const variantClass = variant ? `btn-${variant}` : '';
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';

  return (
    <button
      type={type}
      className={`${baseClass} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span
          style={{
            display: 'inline-block',
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite'
          }}
        />
      ) : (
        icon
      )}
      {children}
      <style jsx>{`
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </button>
  );
}
