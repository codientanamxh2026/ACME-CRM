'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, Shield } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ROLE_CONFIG } from '@/lib/formatters';

export default function TopNavbar({ onToggleMobile }) {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, logout } = useAuth();

  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Bàn làm việc & Báo cáo Tổng quan';
    if (path.startsWith('/customers')) return 'Quản lý Khách hàng & Leads';
    if (path.startsWith('/orders')) return 'Quản lý Đơn hàng & Doanh số';
    if (path.startsWith('/inventory')) return 'Quản lý Kho hàng & Tồn kho';
    if (path.startsWith('/data-hub')) return 'Trung tâm Dữ liệu (Import & Export)';
    if (path.startsWith('/users')) return 'Quản lý Nhân sự & Phân quyền Hệ thống';
    return 'Hệ thống Quản trị Doanh nghiệp';
  };

  const roleInfo = ROLE_CONFIG[user?.role] || { label: user?.role, badgeClass: 'badge-primary' };

  return (
    <header className="top-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={onToggleMobile}
          className="btn-icon"
          style={{ display: 'none' }}
          id="mobile-menu-toggle"
          aria-label="Mở menu"
        >
          <Menu size={20} />
        </button>

        <h1 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {getPageTitle(pathname)}
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* OS Theme Toggle Switch */}
        {mounted && (
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={`Chuyển sang giao diện ${theme === 'dark' ? 'Sáng' : 'Tối'}`}
            aria-label="Đổi giao diện"
            suppressHydrationWarning
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} color="var(--warning)" />
                <span style={{ fontSize: '0.8rem' }} suppressHydrationWarning>Giao diện Sáng</span>
              </>
            ) : (
              <>
                <Moon size={15} color="var(--purple)" />
                <span style={{ fontSize: '0.8rem' }} suppressHydrationWarning>Giao diện Tối</span>
              </>
            )}
          </button>
        )}

        {/* User Info Badge */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <Shield size={14} color="var(--accent)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--text-primary)' }}>
              {user.name}
            </span>
            <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.7rem' }}>
              {roleInfo.label}
            </span>
          </div>
        )}

        <button
          onClick={logout}
          className="btn-icon"
          title="Đăng xuất"
          style={{ color: 'var(--danger)' }}
          aria-label="Đăng xuất"
        >
          <LogOut size={17} />
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          #mobile-menu-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
