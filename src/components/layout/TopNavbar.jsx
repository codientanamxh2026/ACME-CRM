'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Menu,
  Sun,
  Moon,
  LogOut,
  Shield,
  ChevronDown,
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Key
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ROLE_CONFIG, formatDateTime } from '@/lib/formatters';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function TopNavbar({ onToggleMobile }) {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();
  const { user, logout } = useAuth();

  // Menu & Modal states
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Bàn làm việc & Báo cáo Tổng quan';
    if (path.startsWith('/customers')) return 'Quản lý Khách hàng & Leads';
    if (path.startsWith('/orders')) return 'Quản lý Đơn hàng & Doanh số';
    if (path.startsWith('/inventory')) return 'Quản lý Kho hàng & Tồn kho';
    if (path.startsWith('/data-hub')) return 'Trung tâm Dữ liệu (Import & Export)';
    if (path.startsWith('/users')) return 'Quản lý Nhân sự & Phân quyền Hệ thống';
    return 'Hệ thống Quản trị Doanh nghiệp';
  };

  const roleInfo = ROLE_CONFIG[user?.role] || { label: user?.role || 'Người dùng', badgeClass: 'badge-primary' };

  // Generate avatar initials
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      <header className="top-navbar" style={{ position: 'relative' }}>
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

          {/* Facebook-style User Avatar & Profile Trigger */}
          {user && (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="user-pill-btn"
                aria-expanded={menuOpen}
                aria-haspopup="true"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  padding: '4px 10px 4px 5px',
                  borderRadius: '9999px',
                  background: menuOpen ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  transition: 'all 0.2s ease',
                  boxShadow: menuOpen ? '0 0 0 2px var(--accent-subtle)' : 'none'
                }}
              >
                {/* Avatar with status indicator */}
                <div style={{ position: 'relative' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 6px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    {getInitials(user.name)}
                  </div>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0px',
                      right: '0px',
                      width: '9px',
                      height: '9px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%',
                      border: '2px solid var(--bg-surface)'
                    }}
                  />
                </div>

                <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</span>
                </div>

                <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                  {roleInfo.label}
                </span>

                <ChevronDown
                  size={15}
                  color="var(--text-muted)"
                  style={{
                    transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease'
                  }}
                />
              </button>

              {/* Facebook-style Dropdown Menu Modal */}
              {menuOpen && (
                <div
                  className="fb-dropdown-menu animate-fade-in"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '330px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '16px',
                    boxShadow: '0 12px 32px rgba(0, 0, 0, 0.24), 0 4px 12px rgba(0, 0, 0, 0.12)',
                    padding: '0.75rem',
                    zIndex: 100,
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)'
                  }}
                >
                  {/* User Profile Header Card (FB Style) */}
                  <div
                    onClick={() => {
                      setMenuOpen(false);
                      setProfileModalOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      background: 'var(--bg-elevated)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                      border: '1px solid var(--border-subtle)'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700,
                        flexShrink: 0
                      }}
                    >
                      {getInitials(user.name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '3px', fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                        <span>Xem trang thông tin cá nhân</span>
                        <ChevronRight size={13} />
                      </div>
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.65rem 0.25rem' }} />

                  {/* Menu Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {/* Item 1: Profile & Permissions */}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        setProfileModalOpen(true);
                      }}
                      className="fb-menu-item"
                    >
                      <div className="fb-menu-icon">
                        <User size={18} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Thông tin tài khoản</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Xem hồ sơ, phòng ban & quyền hạn</div>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </button>

                    {/* Item 2: Theme Switcher */}
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="fb-menu-item"
                    >
                      <div className="fb-menu-icon">
                        {theme === 'dark' ? <Sun size={18} color="var(--warning)" /> : <Moon size={18} color="var(--purple)" />}
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Chế độ hiển thị</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Hiện đang bật giao diện: <strong>{theme === 'dark' ? 'Tối (Dark)' : 'Sáng (Light)'}</strong>
                        </div>
                      </div>
                    </button>

                    {/* Item 3: API Swagger Docs */}
                    <a
                      href="https://acme-crm.onrender.com/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="fb-menu-item"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <div className="fb-menu-icon">
                        <ExternalLink size={17} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Tài liệu API Swagger</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Kiểm tra & kết nối RESTful API</div>
                      </div>
                    </a>
                  </div>

                  <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '0.65rem 0.25rem' }} />

                  {/* Logout Button (Facebook Red Danger Item) */}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="fb-menu-item fb-menu-item-danger"
                  >
                    <div className="fb-menu-icon fb-menu-icon-danger">
                      <LogOut size={18} />
                    </div>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Đăng xuất</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Thoát khỏi phiên làm việc hiện tại</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <style jsx>{`
          @media (max-width: 900px) {
            #mobile-menu-toggle {
              display: flex !important;
            }
          }
          .fb-menu-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.6rem 0.65rem;
            border-radius: 10px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: var(--text-primary);
            transition: background-color 0.15s ease;
          }
          .fb-menu-item:hover {
            background: var(--bg-hover);
          }
          .fb-menu-icon {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            background: var(--bg-elevated);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            color: var(--text-secondary);
            transition: all 0.15s ease;
          }
          .fb-menu-item:hover .fb-menu-icon {
            background: var(--border-subtle);
            color: var(--text-primary);
          }
          .fb-menu-item-danger:hover {
            background: rgba(239, 68, 68, 0.1) !important;
          }
          .fb-menu-item-danger:hover .fb-menu-icon-danger {
            background: rgba(239, 68, 68, 0.15) !important;
            color: var(--danger) !important;
          }
          .fb-menu-item-danger {
            color: var(--danger);
          }
        `}</style>
      </header>

      {/* Detailed Facebook-style Profile Modal */}
      <Modal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        title="Hồ Sơ Tài Khoản Cá Nhân"
        subtitle="Chi tiết định danh, phân quyền và dữ liệu đăng nhập hệ thống"
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Button
              variant="secondary"
              onClick={() => {
                setProfileModalOpen(false);
                logout();
              }}
              icon={<LogOut size={15} />}
              style={{ color: 'var(--danger)' }}
            >
              Đăng Xuất
            </Button>
            <Button
              variant="primary"
              onClick={() => setProfileModalOpen(false)}
            >
              Đóng
            </Button>
          </div>
        }
      >
        {user && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Top Profile Card Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.08) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)',
                  flexShrink: 0
                }}
              >
                {getInitials(user.name)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {user.name}
                  </h4>
                  <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.72rem' }}>
                    {roleInfo.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {user.email}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '6px', fontSize: '0.75rem', color: 'var(--success)' }}>
                  <CheckCircle2 size={13} />
                  <span>Trạng thái: Đang hoạt động (Active)</span>
                </div>
              </div>
            </div>

            {/* Profile Info Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.85rem'
              }}
            >
              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <User size={14} />
                  <span>Họ và tên</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <Mail size={14} />
                  <span>Email đăng nhập</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', wordBreak: 'break-all' }}>{user.email}</div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <Shield size={14} />
                  <span>Phân quyền vai trò</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)' }}>
                  {roleInfo.label} (Toàn quyền)
                </div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <Building2 size={14} />
                  <span>Phòng ban</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.department || 'Ban Giám Đốc'}</div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <Phone size={14} />
                  <span>Số điện thoại</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.phone || '0901234567'}</div>
              </div>

              <div
                style={{
                  padding: '0.85rem',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <Calendar size={14} />
                  <span>Thời gian tạo</span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {formatDateTime(user.createdAt || '2026-01-01T08:00:00Z')}
                </div>
              </div>
            </div>

            {/* Security note */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.78rem',
                color: 'var(--text-secondary)'
              }}
            >
              <Key size={15} color="var(--success)" />
              <span>Phiên đăng nhập được bảo vệ bởi JSON Web Token (JWT) và mã hóa Bcrypt</span>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
