'use client';

import React, { useState } from 'react';
import { formatVND } from '@/lib/formatters';

export function RevenueChart({ data = [] }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  if (!data || data.length === 0) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu biểu đồ</div>;
  }

  const maxVal = Math.max(...data.map((d) => d.revenue || 0), 10000000);
  const height = 180;
  const width = 500;
  const padding = 35;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1 || 1);
    const y = height - padding - ((d.revenue || 0) / maxVal) * (height - padding * 2);
    return { x, y, ...d };
  });

  // Create smooth SVG path
  const linePath = points.reduce((acc, p, i) => {
    return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 0.5, 1].map((pct, idx) => {
          const y = height - padding - pct * (height - padding * 2);
          return (
            <line
              key={idx}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="var(--border-subtle)"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Gradient fill area */}
        <path d={areaPath} fill="url(#revenueGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={hoverIndex === i ? 6 : 4}
              fill="var(--bg-surface)"
              stroke="var(--accent)"
              strokeWidth="2.5"
              style={{ cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
            />
            {/* X-axis label */}
            <text
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="11"
              fontWeight="500"
            >
              {p.month}
            </text>
          </g>
        ))}
      </svg>

      {/* Floating tooltip */}
      {hoverIndex !== null && points[hoverIndex] && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            padding: '0.4rem 0.75rem',
            fontSize: '0.8rem',
            boxShadow: 'var(--shadow-md)',
            pointerEvents: 'none'
          }}
        >
          <div style={{ color: 'var(--text-muted)' }}>{points[hoverIndex].month}</div>
          <div style={{ fontWeight: 700, color: 'var(--accent)' }}>
            {formatVND(points[hoverIndex].revenue)}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderStatusDonut({ stats = {} }) {
  const categories = [
    { key: 'completed', label: 'Hoàn thành', color: 'var(--success)' },
    { key: 'shipping', label: 'Đang giao', color: 'var(--purple)' },
    { key: 'confirmed', label: 'Đã duyệt', color: 'var(--info)' },
    { key: 'pending', label: 'Chờ duyệt', color: 'var(--warning)' },
    { key: 'cancelled', label: 'Đã hủy', color: 'var(--danger)' }
  ];

  const total = Object.values(stats).reduce((acc, val) => acc + (Number(val) || 0), 0);

  if (total === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        Chưa có đơn hàng nào
      </div>
    );
  }

  // Calculate SVG stroke dashes for donut
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const slices = categories.map((cat) => {
    const count = Number(stats[cat.key]) || 0;
    const ratio = count / total;
    const dashLength = ratio * circumference;
    const slice = {
      ...cat,
      count,
      ratio,
      dasharray: `${dashLength} ${circumference - dashLength}`,
      dashoffset: -offset
    };
    offset += dashLength;
    return slice;
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '1rem', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: '130px', height: '130px', flexShrink: 0 }}>
        <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
          <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--border-subtle)" strokeWidth="12" />
          {slices.map((slice) =>
            slice.count > 0 ? (
              <circle
                key={slice.key}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth="12"
                strokeDasharray={slice.dasharray}
                strokeDashoffset={slice.dashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dasharray 0.3s ease' }}
              />
            ) : null
          )}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>{total}</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Đơn hàng</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
        {slices.map((slice) => (
          <div key={slice.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '3px',
                backgroundColor: slice.color
              }}
            />
            <span style={{ color: 'var(--text-secondary)' }}>{slice.label}:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', marginLeft: 'auto' }}>
              {slice.count} ({Math.round(slice.ratio * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
