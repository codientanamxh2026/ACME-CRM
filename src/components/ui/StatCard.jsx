'use client';

import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend = null, // e.g. { value: '+12%', isPositive: true }
  accentColor = 'var(--accent)'
}) {
  return (
    <div className="card card-glass" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.35rem', letterSpacing: '-0.02em' }}>
            {value}
          </div>
        </div>

        {icon && (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: `color-mix(in srgb, ${accentColor} 15%, transparent)`,
              color: accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px color-mix(in srgb, ${accentColor} 20%, transparent)`
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
          {trend && (
            <span
              style={{
                fontWeight: 600,
                color: trend.isPositive ? 'var(--success)' : 'var(--danger)',
                background: trend.isPositive ? 'var(--success-light)' : 'var(--danger-light)',
                padding: '0.1rem 0.4rem',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span style={{ color: 'var(--text-muted)' }}>{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
