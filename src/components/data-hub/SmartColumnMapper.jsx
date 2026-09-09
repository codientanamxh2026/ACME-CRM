'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Database,
  CheckCircle2,
  AlertTriangle,
  Users,
  Package,
  Layers,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TARGET_COLLECTIONS, autoSuggestFieldMapping } from '@/lib/aiAgent';
import { fetchApi } from '@/lib/api';

export default function SmartColumnMapper({
  dataset,
  savedTables = [],
  onSuccess,
  onCancel
}) {
  const [targetType, setTargetType] = useState('customers'); // 'customers' | 'products' | 'saved_table'
  const [selectedSavedTableId, setSelectedSavedTableId] = useState(savedTables[0]?.id || '');
  const [columnOverrides, setColumnOverrides] = useState({});
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const sourceColumns = useMemo(() => dataset?.columns || [], [dataset]);
  const sourceRows = useMemo(() => dataset?.rows || [], [dataset]);

  // Current target fields definition
  const targetFields = useMemo(() => {
    if (targetType === 'customers') return TARGET_COLLECTIONS.customers.fields;
    if (targetType === 'products') return TARGET_COLLECTIONS.products.fields;

    // If targeting an existing dynamic table
    const table = savedTables.find((t) => t.id === selectedSavedTableId);
    if (table && Array.isArray(table.columns)) {
      return table.columns.map((c) => ({
        key: c.key,
        label: c.label,
        required: false,
        synonyms: [c.key, c.label]
      }));
    }

    return [];
  }, [targetType, selectedSavedTableId, savedTables]);

  // Derive column mapping combining auto-suggestions and user manual adjustments
  const columnMapping = useMemo(() => {
    let base = {};
    if (targetType === 'customers' || targetType === 'products') {
      base = autoSuggestFieldMapping(sourceColumns, targetType);
    } else {
      targetFields.forEach((tf) => {
        const match = sourceColumns.find(
          (sc) =>
            sc.key.toLowerCase() === tf.key.toLowerCase() ||
            sc.label.toLowerCase() === tf.label.toLowerCase()
        );
        if (match) base[tf.key] = match.key;
      });
    }
    return { ...base, ...columnOverrides };
  }, [targetType, sourceColumns, targetFields, columnOverrides]);

  const handleTargetTypeChange = (newType) => {
    setTargetType(newType);
    setColumnOverrides({});
    setImportResult(null);
  };

  // Compute preview rows based on current mapping
  const previewRows = useMemo(() => {
    return sourceRows.slice(0, 3).map((sRow) => {
      const pRow = {};
      targetFields.forEach((field) => {
        const sourceColKey = columnMapping[field.key];
        pRow[field.key] = sourceColKey ? sRow[sourceColKey] : null;
      });
      return pRow;
    });
  }, [sourceRows, targetFields, columnMapping]);

  const handleFieldChange = (targetKey, selectedSourceKey) => {
    setColumnOverrides((prev) => ({
      ...prev,
      [targetKey]: selectedSourceKey || ''
    }));
  };

  const handleExecuteImport = async () => {
    // Validate required fields
    const missingRequired = targetFields.filter((tf) => tf.required && !columnMapping[tf.key]);
    if (missingRequired.length > 0) {
      alert(`Vui lòng chọn cột nguồn cho các trường bắt buộc: ${missingRequired.map((f) => f.label).join(', ')}`);
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      let importedCount = 0;
      let targetPageUrl = '/customers';

      if (targetType === 'customers') {
        targetPageUrl = '/customers';
        for (const sRow of sourceRows) {
          const payload = {
            name: String(sRow[columnMapping.name] || '').trim(),
            phone: String(sRow[columnMapping.phone] || '').trim(),
            email: columnMapping.email ? String(sRow[columnMapping.email] || '').trim() : '',
            address: columnMapping.address ? String(sRow[columnMapping.address] || '').trim() : '',
            contactPerson: columnMapping.contactPerson ? String(sRow[columnMapping.contactPerson] || '').trim() : '',
            group: columnMapping.group ? String(sRow[columnMapping.group] || 'Doanh nghiệp').trim() : 'Doanh nghiệp',
            revenue: columnMapping.revenue ? Number(String(sRow[columnMapping.revenue]).replace(/[.,\sđ]/g, '')) || 0 : 0,
            notes: columnMapping.notes ? String(sRow[columnMapping.notes] || '').trim() : `Nhập tự động từ ${dataset.fileName}`
          };

          if (payload.name && payload.phone) {
            const res = await fetchApi('/api/customers', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            if (res.success) importedCount++;
          }
        }
      } else if (targetType === 'products') {
        targetPageUrl = '/inventory';
        for (const sRow of sourceRows) {
          const skuVal = columnMapping.sku
            ? String(sRow[columnMapping.sku] || '').trim().toUpperCase()
            : `SKU-${Date.now().toString(36).toUpperCase()}`;

          const payload = {
            sku: skuVal,
            name: String(sRow[columnMapping.name] || '').trim(),
            category: columnMapping.category ? String(sRow[columnMapping.category] || 'Hàng hóa').trim() : 'Hàng hóa',
            unit: columnMapping.unit ? String(sRow[columnMapping.unit] || 'Cái').trim() : 'Cái',
            costPrice: columnMapping.costPrice ? Number(String(sRow[columnMapping.costPrice]).replace(/[.,\sđ]/g, '')) || 0 : 0,
            salePrice: columnMapping.salePrice ? Number(String(sRow[columnMapping.salePrice]).replace(/[.,\sđ]/g, '')) || 0 : 0,
            stock: columnMapping.stock ? Number(String(sRow[columnMapping.stock]).replace(/[.,\s]/g, '')) || 0 : 0,
            minStock: columnMapping.minStock ? Number(sRow[columnMapping.minStock]) || 5 : 5,
            description: columnMapping.description ? String(sRow[columnMapping.description] || '').trim() : ''
          };

          if (payload.name && payload.sku) {
            const res = await fetchApi('/api/products', {
              method: 'POST',
              body: JSON.stringify(payload)
            });
            if (res.success) importedCount++;
          }
        }
      } else if (targetType === 'saved_table') {
        targetPageUrl = `/data-hub/tables/${selectedSavedTableId}`;
        const targetTable = savedTables.find((t) => t.id === selectedSavedTableId);
        if (targetTable) {
          // Map new rows
          const newRows = sourceRows.map((sRow, idx) => {
            const rowItem = { id: `row-${Date.now()}-${idx}` };
            targetFields.forEach((tf) => {
              const srcKey = columnMapping[tf.key];
              rowItem[tf.key] = srcKey ? sRow[srcKey] : '';
            });
            return rowItem;
          });

          const combinedRows = [...(targetTable.rows || []), ...newRows];
          const res = await fetchApi(`/api/import-export/dynamic-tables/${selectedSavedTableId}`, {
            method: 'PUT',
            body: JSON.stringify({
              rows: combinedRows,
              rowCount: combinedRows.length
            })
          });

          if (res.success) {
            importedCount = newRows.length;
          }
        }
      }

      setImportResult({
        success: true,
        count: importedCount,
        targetPageUrl,
        message: `Đã nhập thành công ${importedCount} dòng dữ liệu vào hệ thống!`
      });

      if (onSuccess) onSuccess(importedCount);
    } catch (err) {
      setImportResult({
        success: false,
        error: 'Lỗi trong quá trình nhập: ' + err.message
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Step Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="var(--accent)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Ghép Cột Thông Minh (Smart Column Mapping) Vào Bảng Cũ
            </h3>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Hệ thống tự động nhận diện và gợi ý nối các cột của file <strong>{dataset.fileName}</strong> ({dataset.rows?.length} dòng) vào các trường tương ứng trong cơ sở dữ liệu.
          </p>
        </div>

        <Button variant="secondary" size="sm" onClick={onCancel}>
          Hủy & Chọn cách khác
        </Button>
      </div>

      {/* Target Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
        <div
          onClick={() => handleTargetTypeChange('customers')}
          className={`card ${targetType === 'customers' ? 'card-glass' : ''}`}
          style={{
            padding: '1rem',
            cursor: 'pointer',
            border: `2px solid ${targetType === 'customers' ? 'var(--accent)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: targetType === 'customers' ? 'var(--accent)' : 'var(--bg-elevated)',
              color: targetType === 'customers' ? '#fff' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Users size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Bảng Khách Hàng (CRM)
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Nối vào danh sách khách & leads
            </div>
          </div>
        </div>

        <div
          onClick={() => handleTargetTypeChange('products')}
          className={`card ${targetType === 'products' ? 'card-glass' : ''}`}
          style={{
            padding: '1rem',
            cursor: 'pointer',
            border: `2px solid ${targetType === 'products' ? 'var(--accent)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: targetType === 'products' ? 'var(--accent)' : 'var(--bg-elevated)',
              color: targetType === 'products' ? '#fff' : 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Package size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Bảng Kho Hàng & Sản Phẩm
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Nối danh mục mặt hàng, giá, tồn
            </div>
          </div>
        </div>

        {savedTables.length > 0 && (
          <div
            onClick={() => handleTargetTypeChange('saved_table')}
            className={`card ${targetType === 'saved_table' ? 'card-glass' : ''}`}
            style={{
              padding: '1rem',
              cursor: 'pointer',
              border: `2px solid ${targetType === 'saved_table' ? 'var(--accent)' : 'var(--border-subtle)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.2s'
            }}
          >
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--radius-md)',
                background: targetType === 'saved_table' ? 'var(--accent)' : 'var(--bg-elevated)',
                color: targetType === 'saved_table' ? '#fff' : 'var(--text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Layers size={20} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Bảng Động Cũ Đã Lưu
              </div>
              <select
                className="form-select"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', marginTop: '0.2rem', width: '100%' }}
                value={selectedSavedTableId}
                onChange={(e) => {
                  setTargetType('saved_table');
                  setSelectedSavedTableId(e.target.value);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {savedTables.map((tbl) => (
                  <option key={tbl.id} value={tbl.id}>
                    {tbl.title} ({tbl.rowCount} dòng)
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Mapping Configuration Table */}
      <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
          Cấu Hình Khớp Nối Cột ({targetFields.length} trường đích)
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.75rem' }}>
          {targetFields.map((field) => (
            <div
              key={field.key}
              style={{
                background: 'var(--bg-surface)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem'
              }}
            >
              <div style={{ minWidth: '130px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {field.label}
                </span>
                {field.required && (
                  <span style={{ color: 'var(--danger)', marginLeft: '0.25rem' }}>*</span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
                <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                <select
                  className="form-select"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.5rem',
                    width: '100%',
                    borderColor: columnMapping[field.key] ? 'var(--accent)' : 'var(--border-strong)'
                  }}
                  value={columnMapping[field.key] || ''}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                >
                  <option value="">-- Bỏ qua trường này --</option>
                  {sourceColumns.map((sc) => (
                    <option key={sc.key} value={sc.key}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Section */}
      <div>
        <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          Xem Trước Dữ Liệu Sau Khi Ghép (3 Dòng Đầu)
        </h4>

        <div className="table-container" style={{ maxHeight: '180px' }}>
          <table className="data-table">
            <thead>
              <tr>
                {targetFields.map((tf) => (
                  <th key={tf.key} style={{ fontSize: '0.8rem', padding: '0.5rem 0.75rem' }}>
                    {tf.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((pRow, idx) => (
                <tr key={idx}>
                  {targetFields.map((tf) => (
                    <td key={tf.key} style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem' }}>
                      {pRow[tf.key] !== undefined && pRow[tf.key] !== null && pRow[tf.key] !== '' ? (
                        String(pRow[tf.key])
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Trống</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Result Alert */}
      {importResult && (
        <div
          style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: importResult.success ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${importResult.success ? 'var(--success)' : 'var(--danger)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {importResult.success ? (
              <CheckCircle2 size={20} color="var(--success)" />
            ) : (
              <AlertTriangle size={20} color="var(--danger)" />
            )}
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: importResult.success ? 'var(--success)' : 'var(--danger)' }}>
              {importResult.message || importResult.error}
            </span>
          </div>

          {importResult.success && (
            <Link href={importResult.targetPageUrl} className="btn btn-primary btn-sm">
              Mở Trang Xem Dữ Liệu
              <ChevronRight size={15} />
            </Link>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
        <Button variant="secondary" onClick={onCancel} disabled={importing}>
          Hủy Bỏ
        </Button>
        <Button
          variant="primary"
          loading={importing}
          icon={<CheckCircle2 size={16} />}
          onClick={handleExecuteImport}
        >
          Tiến Hành Nhập {sourceRows.length} Dòng Vào Bảng
        </Button>
      </div>
    </div>
  );
}
