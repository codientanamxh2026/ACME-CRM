'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { useAuth } from '@/context/AuthContext';

const emptySubscribe = () => () => {};

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // If on login page, render children directly
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isClient && !loading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, loading, isLoginPage, router, isClient]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isClient || loading) {
    return (
      <div
        suppressHydrationWarning
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--bg-base)'
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--accent)',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }}
        />
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Đang khởi tạo hệ thống CRM...
        </span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="app-container">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        isMobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={`main-wrapper ${collapsed ? 'expanded' : ''}`}>
        <TopNavbar onToggleMobile={() => setMobileOpen(!mobileOpen)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
