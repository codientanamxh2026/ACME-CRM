'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Download,
  Save,
  RefreshCw,
  FileText,
  CheckCircle,
  Database,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Share2
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import DataTable from '@/components/ui/DataTable';
import ShareTableModal from '@/components/data-hub/ShareTableModal';
import { useAuth } from '@/context/AuthContext';
import { exportToExcel } from '@/lib/excel';
import { formatVND, formatNumber } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';
import { generateAIInsights } from '@/lib/aiAgent';

export default function DynamicTableViewer({
  dataset,
  onReset,
  onSaved
}) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [tableTitle, setTableTitle] = useState(
    dataset?.fileName?.replace(/\.[^/.]+$/, '') || 'Bảng dữ liệu nhập từ file'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [savedTableId, setSavedTableId] = useState(null);
  const [savedTableData, setSavedTableData] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // AI Insights State
  const [aiInsight, setAiInsight] = useState(null);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  // Construct column definitions dynamically from the parsed columns
  const tableColumns = useMemo(() => {
    if (!dataset || !dataset.columns) return [];

    return dataset.columns.map((col) => {
      return {
        key: col.key,
        label: col.label,
        sortable: true,
        align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
        render: (value) => {
          if (value === undefined || value === null || value === '') {
            return <span style={{ color: 'var(--text-muted)' }}>-</span>;
          }

          if (col.type === 'currency') {
            return <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatVND(value)}</span>;
          }

          if (col.type === 'number') {
            return <span style={{ fontWeight: 500 }}>{formatNumber(value)}</span>;
          }

          if (col.type === 'email') {
            return (
              <a
                href={`mailto:${value}`}
                style={{ color: 'var(--accent)', textDecoration: 'underline' }}
                onClick={(e) => e.stopPropagation()}
              >
                {value}
              </a>
            );
          }

          if (col.type === 'phone') {
            return (
              <a
                href={`tel:${value}`}
                style={{ color: 'var(--info-text)', fontWeight: 500 }}
                onClick={(e) => e.stopPropagation()}
              >
                {value}
              </a>
            );
          }

          if (col.type === 'status') {
            return <Badge variant="primary">{String(value)}</Badge>;
          }

          return String(value);
        }
      };
    });
  }, [dataset]);

  const handleExport = () => {
    exportToExcel(dataset.rows, tableTitle || 'bang-du-lieu-crm');
  };

  const handleSaveToCRM = async () => {
    if (!tableTitle.trim()) {
      alert('Vui lòng nhập tên cho bảng dữ liệu');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetchApi('/api/import-export/dynamic-tables', {
        method: 'POST',
        body: JSON.stringify({
          title: tableTitle.trim(),
          sourceFileName: dataset.fileName,
          columns: dataset.columns,
          rows: dataset.rows
        })
      });

      if (res.success) {
        setSaveSuccess(true);
        setSavedTableId(res.data.id);
        setSavedTableData(res.data);

        // Notify sidebar to refresh custom tables list
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed'));
        }

        if (onSaved) onSaved(res.data);
      } else {
        alert(res.error || 'Lỗi khi lưu bảng vào hệ thống');
      }
    } catch (err) {
      alert('Lỗi lưu bảng: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunAIAnalysis = async () => {
    setAnalyzingAI(true);
    try {
      const insight = await generateAIInsights(tableTitle, dataset.columns, dataset.rows);
      setAiInsight(insight);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzingAI(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Table Header Info */}
      <div
        className="card card-glass"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          padding: '1.25rem'
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <FileText size={20} color="var(--accent)" />
            {isAdmin ? (
              <input
                type="text"
                className="form-input"
                value={tableTitle}
                onChange={(e) => setTableTitle(e.target.value)}
                placeholder="Đặt tên bảng thông tin..."
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  padding: '0.3rem 0.6rem',
                  maxWidth: '400px',
                  borderColor: 'var(--border-subtle)',
                  background: 'var(--bg-surface)'
                }}
              />
            ) : (
              <span style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {tableTitle}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            <span>Tệp nguồn: <strong style={{ color: 'var(--text-primary)' }}>{dataset.fileName}</strong></span>
            <span>•</span>
            <span>Tổng số dòng: <strong style={{ color: 'var(--accent)' }}>{dataset.rowCount}</strong></span>
            <span>•</span>
            <span>Số cột nhận diện: <strong style={{ color: 'var(--text-primary)' }}>{dataset.columns.length}</strong></span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.6rem' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Sparkles size={14} color="var(--accent)" />}
            loading={analyzingAI}
            onClick={handleRunAIAnalysis}
            title="Sử dụng trí tuệ nhân tạo để tóm tắt và phân tích nhanh tập dữ liệu"
          >
            AI Phân Tích
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={14} />}
            onClick={onReset}
          >
            Nhập file khác
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={14} />}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>

          {isAdmin && (
            !saveSuccess ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Save size={14} />}
                loading={isSaving}
                onClick={handleSaveToCRM}
              >
                Tạo Bảng Mới & Lưu CRM
              </Button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Share2 size={14} color="var(--accent)" />}
                  onClick={() => setIsShareModalOpen(true)}
                  title="Cài đặt quyền chia sẻ người dùng hoặc sửa tên link"
                >
                  Cài Đặt Chia Sẻ Link
                </Button>

                <Link
                  href={`/data-hub/tables/${savedTableId}`}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--success)' }}
                >
                  <CheckCircle size={14} />
                  Mở Trang Bảng Riêng
                  <ChevronRight size={14} />
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* AI Insight Box if triggered */}
      {aiInsight && (
        <div
          className="card card-glass"
          style={{
            padding: '1.25rem',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(147, 51, 234, 0.08))',
            borderColor: 'rgba(99, 102, 241, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--accent)' }}>
              <Sparkles size={16} />
              Trợ Lý AI Phân Tích Dữ Liệu
            </div>
            <button
              onClick={() => setAiInsight(null)}
              className="btn-icon"
              style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>

          {aiInsight.aiInsight ? (
            <p style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {aiInsight.aiInsight}
            </p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.84rem' }}>
              <div>
                Tập dữ liệu gồm <strong>{aiInsight.totalRows} dòng</strong> và <strong>{aiInsight.totalColumns} cột</strong> thông tin tự động nhận diện.
              </div>
              {aiInsight.highlightStats?.map((stat, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>{stat.column}:</span>{' '}
                  <strong style={{ color: 'var(--accent)' }}>
                    {stat.type === 'currency' ? formatVND(stat.sum) : formatNumber(stat.sum)}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.35rem' }}>
                    (TB: {stat.type === 'currency' ? formatVND(stat.avg) : formatNumber(stat.avg)})
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Schema / Column Tags Pill Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          flexWrap: 'wrap',
          padding: '0.6rem 0.85rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.8rem'
        }}
      >
        <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Cột dữ liệu ({dataset.columns.length}):</span>
        {dataset.columns.map((c) => (
          <span
            key={c.key}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <span>{c.label}</span>
            <span
              style={{
                fontSize: '0.68rem',
                color: c.type === 'currency' ? 'var(--accent)' : c.type === 'phone' ? 'var(--info)' : 'var(--text-muted)'
              }}
            >
              ({c.type === 'currency' ? 'tiền tệ' : c.type === 'phone' ? 'SĐT' : c.type === 'email' ? 'email' : c.type === 'number' ? 'số' : 'chữ'})
            </span>
          </span>
        ))}
      </div>

      {/* Interactive Data Table Preview */}
      <DataTable
        columns={tableColumns}
        data={dataset.rows}
        searchPlaceholder={`Tìm kiếm trong ${tableTitle}...`}
        exportFileName={tableTitle?.toLowerCase().replace(/\s+/g, '-')}
        defaultPageSize={10}
      />

      {/* Share & Rename Link Modal (Admin Only) */}
      {isAdmin && savedTableData && (
        <ShareTableModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          table={savedTableData}
          onSaved={(updated) => {
            setSavedTableData(updated);
            setTableTitle(updated.title);
          }}
        />
      )}
    </div>
  );
}
