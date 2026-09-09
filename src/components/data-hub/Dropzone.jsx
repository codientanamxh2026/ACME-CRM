'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, Download, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { parseExcelOrCsv, downloadSampleTemplate } from '@/lib/excel';
import { fetchApi } from '@/lib/api';

export default function Dropzone({ onFileParsed }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    setError(null);
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

    if (!hasValidExt) {
      setError('Vui lòng chọn file định dạng Excel (.xlsx, .xls) hoặc CSV (.csv)');
      return;
    }

    setIsUploading(true);

    try {
      // 1. First parse directly in-browser using SheetJS for instant speed & zero network lag
      const localResult = await parseExcelOrCsv(file);
      if (localResult.success) {
        onFileParsed(localResult);
        return;
      }

      // 2. Fallback to server-side parser if browser parsing had format issues
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetchApi('/api/files/upload', {
        method: 'POST',
        body: formData
      });

      if (res.success && res.data) {
        onFileParsed(res.data);
      } else {
        setError(res.error || localResult.error || 'Không thể đọc nội dung file');
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setError('Lỗi phân tích file: ' + (err.message || 'Định dạng không được hỗ trợ'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div>
      <div
        className={`dropzone ${isDragOver ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          style={{ display: 'none' }}
          onChange={handleChange}
        />

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'var(--accent-light)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px var(--accent-glow)'
          }}
        >
          {isUploading ? (
            <span
              style={{
                display: 'inline-block',
                width: '24px',
                height: '24px',
                border: '3px solid var(--accent)',
                borderRightColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite'
              }}
            />
          ) : (
            <UploadCloud size={28} />
          )}
        </div>

        <div>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Kéo thả file Excel / CSV vào đây hoặc bấm để chọn file
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
            Hỗ trợ file <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong> (Tải lên máy chủ Backend &amp; Tự động nhận diện cấu trúc cột)
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<FileSpreadsheet size={15} />}
          loading={isUploading}
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Chọn file từ máy tính
        </Button>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            marginTop: '0.75rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-light)',
            color: 'var(--danger-text)',
            fontSize: '0.85rem'
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Quick sample downloads */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginTop: '1rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.82rem',
          color: 'var(--text-secondary)'
        }}
      >
        <span>Chưa có file mẫu để test thử?</span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={13} />}
            onClick={() => downloadSampleTemplate('customers')}
          >
            Tải mẫu Khách hàng (.xlsx)
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<Download size={13} />}
            onClick={() => downloadSampleTemplate('products')}
          >
            Tải mẫu Sản phẩm Kho (.xlsx)
          </Button>
        </div>
      </div>
    </div>
  );
}
