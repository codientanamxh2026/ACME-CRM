'use client';

import React from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import AppLayout from './AppLayout';

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppLayout>{children}</AppLayout>
      </AuthProvider>
    </ThemeProvider>
  );
}
