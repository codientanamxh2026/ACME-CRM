'use client';

import React from 'react';

export default function Badge({
  children,
  variant = 'primary', // primary | success | warning | danger | info | purple
  className = '',
  icon = null
}) {
  return (
    <span className={`badge badge-${variant} ${className}`.trim()}>
      {icon}
      {children}
    </span>
  );
}
