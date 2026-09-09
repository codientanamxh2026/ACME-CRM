'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
  PlusCircle,
  Loader2
} from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { RevenueChart, OrderStatusDonut } from '@/components/charts/MiniCharts';
import { formatVND, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    const res = await fetchApi('/api/stats');
    if (res.success) {
      setStats(res.stats);
    }
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    fetchApi('/api/stats').then((res) => {
      if (!ignore) {
        if (res.success) setStats(res.stats);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Loading header indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="skeleton-shimmer skeleton-text" style={{ width: '220px', height: '24px' }} />
          <div className="loading-badge">
            <Loader2 size={13} className="spinner-icon" />
            <span>Đang tải số liệu thời gian thực từ Supabase...</span>
          </div>
        </div>

        {/* 4 Stat Cards Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card card-glass" style={{ padding: '1.25rem', height: '115px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="skeleton-shimmer skeleton-text" style={{ width: '45%', height: '14px' }} />
                <div className="skeleton-shimmer skeleton-circle" style={{ width: '36px', height: '36px' }} />
              </div>
              <div className="skeleton-shimmer skeleton-text" style={{ width: '65%', height: '26px' }} />
            </div>
          ))}
        </div>

        {/* 2 Charts Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          <div className="card" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton-shimmer skeleton-text" style={{ width: '40%', height: '18px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', flex: 1, borderRadius: 'var(--radius-md)' }} />
          </div>
          <div className="card" style={{ padding: '1.5rem', height: '320px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="skeleton-shimmer skeleton-text" style={{ width: '40%', height: '18px' }} />
            <div className="skeleton-shimmer" style={{ width: '100%', flex: 1, borderRadius: 'var(--radius-md)' }} />
          </div>
        </div>

        {/* Recent Orders Skeleton */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div className="skeleton-shimmer skeleton-text" style={{ width: '25%', height: '18px', marginBottom: '1rem' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton-shimmer skeleton-text" style={{ width: '100%', height: '38px' }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner with Quick Actions */}
      <div
        className="card-glass"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(99, 102, 241, 0.05))',
          borderColor: 'rgba(59, 130, 246, 0.2)'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Chào mừng trở lại hệ thống quản trị ACME CRM
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Tổng hợp dữ liệu bán hàng, quản lý đơn hàng và trạng thái kho hàng cập nhật thời gian thực.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Link href="/data-hub">
            <Button variant="secondary" size="sm" icon={<PlusCircle size={15} />}>
              Import File Excel
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="primary" size="sm" icon={<ShoppingBag size={15} />}>
              Tạo Đơn Hàng Mới
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Tổng Doanh Thu"
          value={formatVND(stats.totalRevenue)}
          trend={{ value: '+18.4%', isPositive: true }}
          subtitle="so với tháng trước"
          icon={<DollarSign size={20} />}
          accentColor="var(--accent)"
        />

        <StatCard
          title="Tổng Số Đơn Hàng"
          value={stats.totalOrders}
          trend={{ value: '+12.5%', isPositive: true }}
          subtitle="đơn đã ghi nhận"
          icon={<ShoppingBag size={20} />}
          accentColor="var(--purple)"
        />

        <StatCard
          title="Khách Hàng Quản Lý"
          value={stats.totalCustomers}
          trend={{ value: '+5 mới', isPositive: true }}
          subtitle="trong tháng này"
          icon={<Users size={20} />}
          accentColor="var(--success)"
        />

        <StatCard
          title="Cảnh Báo Tồn Kho"
          value={stats.lowStockCount}
          subtitle={stats.lowStockCount > 0 ? 'mặt hàng sắp hết kho' : 'kho hàng an toàn'}
          icon={<AlertTriangle size={20} />}
          accentColor="var(--warning)"
        />
      </div>

      {/* 2 Visual Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Revenue Trend Chart */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={18} color="var(--accent)" />
                Xu Hướng Doanh Thu Bán Hàng
              </div>
              <div className="card-subtitle">Biểu đồ biến động doanh thu 6 tháng gần nhất</div>
            </div>
          </div>
          <RevenueChart data={stats.monthlyRevenue} />
        </div>

        {/* Order Status Breakdown */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShoppingBag size={18} color="var(--purple)" />
                Tỷ Lệ Trạng Thái Đơn Hàng
              </div>
              <div className="card-subtitle">Cơ cấu tình trạng đơn hàng toàn hệ thống</div>
            </div>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            <OrderStatusDonut stats={stats.ordersByStatus} />
          </div>
        </div>
      </div>

      {/* Tables Row: Recent Orders + Low Stock Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        {/* Recent Orders */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Đơn Hàng Gần Đây</div>
              <div className="card-subtitle">5 giao dịch bán hàng mới nhất</div>
            </div>
            <Link href="/orders">
              <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>
                Xem tất cả
              </Button>
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã Đơn</th>
                  <th>Khách Hàng</th>
                  <th style={{ textAlign: 'right' }}>Tổng Tiền</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                      Chưa có đơn hàng
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map((ord) => {
                    const statusConf = ORDER_STATUS_CONFIG[ord.status] || {
                      label: ord.status,
                      badgeClass: 'badge-primary'
                    };
                    return (
                      <tr key={ord.id}>
                        <td>
                          <strong style={{ color: 'var(--accent)' }}>{ord.orderNumber}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {formatDateTime(ord.createdAt)}
                          </div>
                        </td>
                        <td>{ord.customerName}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatVND(ord.totalAmount)}
                        </td>
                        <td>
                          <span className={`badge ${statusConf.badgeClass}`}>
                            {statusConf.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title" style={{ color: stats.lowStockCount > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>
                <AlertTriangle size={18} />
                Cảnh Báo Tồn Kho Sắp Hết
              </div>
              <div className="card-subtitle">Các mặt hàng đạt hoặc dưới mức tối thiểu</div>
            </div>
            <Link href="/inventory">
              <Button variant="ghost" size="sm" icon={<ArrowRight size={14} />}>
                Vào kho
              </Button>
            </Link>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã SKU</th>
                  <th>Tên Sản Phẩm</th>
                  <th style={{ textAlign: 'center' }}>Tồn Hiện Tại</th>
                  <th style={{ textAlign: 'center' }}>Tối Thiểu</th>
                </tr>
              </thead>
              <tbody>
                {stats.lowStockProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--success)' }}>
                      ✓ Tất cả mặt hàng đều trong ngưỡng tồn kho an toàn!
                    </td>
                  </tr>
                ) : (
                  stats.lowStockProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <strong style={{ color: 'var(--warning)' }}>{prod.sku}</strong>
                      </td>
                      <td>
                        <div>{prod.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{prod.category}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge badge-danger">
                          {prod.stock} {prod.unit}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                        {prod.minStock} {prod.unit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
