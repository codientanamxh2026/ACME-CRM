'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  FileSpreadsheet,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_CONFIG } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';

export default function Sidebar({ collapsed, onToggleCollapse, isMobileOpen, onCloseMobile }) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [customTables, setCustomTables] = useState([]);

  useEffect(() => {
    let ignore = false;
    const fetchTables = () => {
      fetchApi(`/api/import-export/dynamic-tables?all=true&t=${Date.now()}`).then((res) => {
        if (!ignore && res.success && Array.isArray(res.data)) {
          setCustomTables(res.data);
        }
      });
    };

    fetchTables();

    const handleTablesChanged = (e) => {
      if (e?.detail && e.detail.id) {
        setCustomTables((prev) => {
          const exists = prev.some((t) => t.id === e.detail.id);
          if (exists) {
            return prev.map((t) => (t.id === e.detail.id ? { ...t, ...e.detail } : t));
          }
          return [e.detail, ...prev];
        });
      }
      fetchTables();
    };

    window.addEventListener('crm:tables-changed', handleTablesChanged);
    return () => {
      ignore = true;
      window.removeEventListener('crm:tables-changed', handleTablesChanged);
    };
  }, []);

  const navSections = [
    {
      title: 'TỔNG QUAN',
      items: [
        {
          label: 'Bàn làm việc (Dashboard)',
          href: '/dashboard',
          icon: <LayoutDashboard size={18} />
        }
      ]
    },
    {
      title: 'BÁN HÀNG & CRM',
      items: [
        {
          label: 'Khách hàng (CRM)',
          href: '/customers',
          icon: <Users size={18} />
        },
        {
          label: 'Đơn hàng & Pipeline',
          href: '/orders',
          icon: <ShoppingBag size={18} />
        }
      ]
    },
    {
      title: 'KHO & SẢN PHẨM',
      items: [
        {
          label: 'Kho & Hàng hóa',
          href: '/inventory',
          icon: <Package size={18} />
        }
      ]
    },
    {
      title: 'DỮ LIỆU THÔNG MINH',
      items: [
        {
          label: 'Nhập / Xuất File Hub',
          href: '/data-hub',
          icon: <FileSpreadsheet size={18} />,
          badge: 'Smart'
        }
      ]
    },
    {
      title: 'HỆ THỐNG & BẢO MẬT',
      adminOnly: true,
      items: [
        {
          label: 'Phân quyền & Nhân sự',
          href: '/users',
          icon: <ShieldCheck size={18} />
        }
      ]
    }
  ];

  const roleInfo = ROLE_CONFIG[user?.role] || { label: user?.role, badgeClass: 'badge-primary' };

  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}
    >
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="sidebar-logo">A</div>
          {!collapsed && (
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                ACME CRM
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Enterprise Sales & Stock
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="btn-icon"
          style={{ width: '28px', height: '28px', display: 'flex' }}
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation List */}
      <div className="sidebar-nav">
        {navSections.map((section, sIdx) => {
          if (section.adminOnly && !hasRole(['admin'])) return null;

          return (
            <div key={sIdx} style={{ marginBottom: '0.6rem' }}>
              {!collapsed && <div className="nav-section-title">{section.title}</div>}
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    {item.icon}
                    {!collapsed && <span className="nav-label">{item.label}</span>}
                    {!collapsed && item.badge && (
                      <span className="nav-badge" style={{ background: 'var(--accent)', color: '#fff' }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}

        {/* Custom Dynamic Tables Section */}
        {customTables.length > 0 && (
          <div style={{ marginBottom: '0.6rem' }}>
            {!collapsed && (
              <div className="nav-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{user?.role === 'admin' ? `BẢNG DỮ LIỆU ĐỘNG (${customTables.length})` : `BẢNG ĐƯỢC CHIA SẺ (${customTables.length})`}</span>
              </div>
            )}
            {customTables.map((tbl) => {
              const tableHref = `/data-hub/tables/${tbl.slug || tbl.id}`;
              const isActive =
                pathname === tableHref ||
                pathname === `/data-hub/tables/${tbl.id}` ||
                (tbl.slug && pathname === `/data-hub/tables/${tbl.slug}`);
              return (
                <Link
                  key={tbl.id}
                  href={tableHref}
                  onClick={onCloseMobile}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  title={collapsed ? tbl.title : undefined}
                >
                  <Database size={18} color={isActive ? 'var(--accent)' : 'inherit'} />
                  {!collapsed && (
                    <span
                      className="nav-label"
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: isActive ? 600 : 500
                      }}
                    >
                      {tbl.title}
                    </span>
                  )}
                  {!collapsed && (
                    <span
                      className="nav-badge"
                      style={{
                        background: isActive ? 'var(--accent)' : 'var(--bg-hover)',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.7rem'
                      }}
                    >
                      {tbl.rowCount || tbl.rows?.length || 0}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer User Info */}
      <div
        style={{
          padding: '0.85rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-elevated)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--accent)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: '0.85rem',
            flexShrink: 0
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>

        {!collapsed && (
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.name || 'Tài khoản'}
            </div>
            <div style={{ display: 'flex', marginTop: '0.15rem' }}>
              <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.68rem', padding: '0.05rem 0.4rem' }}>
                {roleInfo.label}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className="btn-icon"
          style={{ width: '32px', height: '32px', flexShrink: 0 }}
          title="Đăng xuất"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
