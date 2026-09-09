'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  ArrowRight,
  Users,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  Lock,
  Sun,
  Moon,
  CheckCircle2,
  BarChart3,
  Database,
  Terminal,
  Zap
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const { user } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit'
      }}
    >
      {/* Background Ambience / Glow Lights */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '900px',
          height: '450px',
          background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.18) 0%, rgba(139, 92, 246, 0.12) 40%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(50px)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '35%',
          right: '-10%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
          filter: 'blur(60px)'
        }}
      />

      {/* Modern Top Header Navigation */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'var(--header-bg)',
          borderBottom: '1px solid var(--border-subtle)',
          transition: 'background-color 0.2s ease, border-color 0.2s ease'
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Logo & Brand */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.35)',
                color: '#ffffff'
              }}
            >
              <Shield size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                ACME <span style={{ color: 'var(--primary)' }}>CRM</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Enterprise Platform
              </div>
            </div>
          </Link>

          {/* Actions: Theme Toggle & Login CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {mounted && (
              <button
                type="button"
                onClick={toggleTheme}
                className="btn btn-ghost btn-icon"
                title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
                aria-label="Toggle Theme"
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-surface)'
                }}
              >
                {theme === 'dark' ? <Sun size={17} color="#fbbf24" /> : <Moon size={17} color="#6366f1" />}
              </button>
            )}

            {user ? (
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Button variant="primary" icon={<ArrowRight size={16} />}>
                  Vào Bảng Điều Khiển
                </Button>
              </Link>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button variant="primary" icon={<Lock size={15} />}>
                  Đăng Nhập
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero Content */}
      <main style={{ flex: 1, position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        <section
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '4.5rem 1.5rem 3rem 1.5rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {/* Badge Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 1rem',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              color: 'var(--primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              marginBottom: '1.75rem',
              boxShadow: '0 2px 8px rgba(59, 130, 246, 0.12)'
            }}
          >
            <Sparkles size={14} />
            <span>Hệ thống CRM & Kho Doanh Nghiệp 2026</span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
              fontWeight: 850,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              maxWidth: '920px',
              margin: '0 auto 1.5rem auto'
            }}
          >
            Quản Trị Khách Hàng, Đơn Hàng & Kho Hàng{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Thông Minh & Hiện Đại
            </span>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: 'var(--text-secondary)',
              maxWidth: '720px',
              lineHeight: 1.6,
              margin: '0 auto 2.5rem auto'
            }}
          >
            Nền tảng CRM nội bộ dành riêng cho doanh nghiệp: tối ưu hóa hành trình khách hàng, 
            kiểm soát tồn kho theo thời gian thực, bảng dữ liệu động linh hoạt và bảo mật chuẩn Enterprise.
          </p>

          {/* Primary CTA Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}
          >
            {user ? (
              <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                <Button
                  variant="primary"
                  icon={<ArrowRight size={18} />}
                  style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', borderRadius: '12px' }}
                >
                  Truy Cập Dashboard Quản Trị
                </Button>
              </Link>
            ) : (
              <Link href="/login" style={{ textDecoration: 'none' }}>
                <Button
                  variant="primary"
                  icon={<Lock size={18} />}
                  style={{
                    padding: '0.85rem 2.2rem',
                    fontSize: '1.05rem',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(59, 130, 246, 0.35)'
                  }}
                >
                  Đăng Nhập Vào Hệ Thống
                </Button>
              </Link>
            )}

            <a
              href="https://acme-crm.onrender.com/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                padding: '0.85rem 1.75rem',
                fontSize: '1.05rem',
                borderRadius: '12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              <Terminal size={17} />
              <span>Swagger API Docs</span>
            </a>
          </div>

          {/* Trust Highlights Strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1.75rem',
              flexWrap: 'wrap',
              marginTop: '3.5rem',
              paddingTop: '2rem',
              borderTop: '1px solid var(--border-subtle)',
              width: '100%',
              maxWidth: '850px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Bảo mật JWT & RBAC</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Đồng bộ Supabase Cloud</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>Import/Export Excel chuẩn</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={16} color="var(--success)" />
              <span>SLA Uptime 99.9%</span>
            </div>
          </div>
        </section>

        {/* Core Features Grid */}
        <section
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1.5rem 5rem 1.5rem',
            width: '100%'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
              Tính Năng Trọng Tâm Thiết Kế Cho Doanh Nghiệp
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Giao diện hiện đại, trực quan, thao tác nhanh như Google Sheets và tối ưu cho hiệu suất vận hành
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem'
            }}
          >
            {/* Card 1: Khách hàng */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                Quản Lý Khách Hàng 360°
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>
                Lưu trữ toàn diện hồ sơ khách hàng, phân loại nhóm đối tác, lịch sử giao dịch và doanh thu tích lũy tự động.
              </p>
            </div>

            {/* Card 2: Đơn hàng & Kho */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Package size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                Kho Hàng & Đơn Hàng Tự Động
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>
                Theo dõi biến động xuất nhập tồn tức thì, tự động trừ kho khi xuất đơn và cảnh báo sản phẩm chạm ngưỡng tồn tối thiểu.
              </p>
            </div>

            {/* Card 3: Data Hub & Bảng Động */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(139, 92, 246, 0.12)',
                  color: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Layers size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                Data Hub & Bảng Động
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>
                Tạo bảng linh hoạt như Google Sheets: thêm/xoá hàng cột giữa bảng, AI gợi ý map cột thông minh và xuất nhập Excel đa định dạng.
              </p>
            </div>

            {/* Card 4: Bảo Mật RBAC */}
            <div
              className="card"
              style={{
                padding: '1.75rem',
                borderRadius: '16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: 'rgba(236, 72, 153, 0.12)',
                  color: '#ec4899',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.25rem'
                }}
              >
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                Bảo Mật & Phân Quyền RBAC
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, flex: 1 }}>
                Bảo mật mã nguồn, phân quyền Quản trị viên (Admin), bảo vệ bằng token JWT và mã hóa mật khẩu Bcrypt an toàn tuyệt đối.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Minimal Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          padding: '1.75rem 1.5rem',
          position: 'relative',
          zIndex: 10
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.85rem',
            color: 'var(--text-muted)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} color="var(--primary)" />
            <span>© 2026 <strong>ACME CRM</strong>. Nền tảng quản trị nội bộ doanh nghiệp.</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Đăng nhập Quản trị
            </Link>
            <a
              href="https://acme-crm.onrender.com/api-docs"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
            >
              API Swagger
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
