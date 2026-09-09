'use client';

import React, { useState, useEffect, useMemo, useCallback, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Database,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Download,
  Calendar,
  FileSpreadsheet,
  User,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Columns,
  SlidersHorizontal,
  Share2,
  Globe,
  Users,
  FileSpreadsheet as SheetIcon
} from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ShareTableModal from '@/components/data-hub/ShareTableModal';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { exportToExcel } from '@/lib/excel';
import { formatVND, formatNumber, formatDateTime } from '@/lib/formatters';

export default function DynamicTableDetailPage({ params }) {
  const resolvedParams = use(params);
  const tableId = resolvedParams.id;
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State for Adding / Editing row
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [rowInsertTarget, setRowInsertTarget] = useState(null); // { type: 'above'|'below'|'start', index: number }
  const [rowFormData, setRowFormData] = useState({});
  const [savingRow, setSavingRow] = useState(false);

  // Modal State for Adding / Managing / Editing columns (Admin Only)
  const [isAddColModalOpen, setIsAddColModalOpen] = useState(false);
  const [isManageColsModalOpen, setIsManageColsModalOpen] = useState(false);
  const [isEditColModalOpen, setIsEditColModalOpen] = useState(false);
  const [editingCol, setEditingCol] = useState(null); // { key, label, type, index }
  const [colInsertTarget, setColInsertTarget] = useState(null); // { type: 'left'|'right'|'end', index: number, targetLabel: string }
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [newColDefaultVal, setNewColDefaultVal] = useState('');
  const [savingCol, setSavingCol] = useState(false);

  // Modal State for Sharing & Renaming link (Admin Only)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Load Table Details
  useEffect(() => {
    let ignore = false;
    fetchApi(`/api/import-export/dynamic-tables/${tableId}?t=${Date.now()}`)
      .then((res) => {
        if (!ignore) {
          if (res.success) {
            setTable(res.data);
          } else {
            setError(res.error || 'Không tìm thấy bảng dữ liệu');
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [tableId]);

  // Open modal to edit existing row
  const handleOpenEdit = useCallback((row, index) => {
    setRowFormData({ ...row });
    setEditingRowIndex(index);
    setIsModalOpen(true);
  }, []);

  // Delete row
  const handleDeleteRow = useCallback(
    async (rowIndex, rowToDelete = null) => {
      if (!confirm('Bạn có chắc muốn xóa dòng dữ liệu này?')) return;

      try {
        const updatedRows = [...(table?.rows || [])];
        if (rowToDelete && rowToDelete.id) {
          const idx = updatedRows.findIndex((r) => r.id === rowToDelete.id);
          if (idx !== -1) {
            updatedRows.splice(idx, 1);
          } else {
            updatedRows.splice(rowIndex, 1);
          }
        } else {
          updatedRows.splice(rowIndex, 1);
        }

        const targetId = table?.id || tableId;
        const res = await fetchApi(`/api/import-export/dynamic-tables/${targetId}`, {
          method: 'PUT',
          body: JSON.stringify({
            rows: updatedRows,
            rowCount: updatedRows.length
          })
        });

        if (res.success) {
          setTable(res.data);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('crm:tables-changed', { detail: res.data }));
          }
        } else {
          alert(res.error || 'Lỗi khi xóa dòng');
        }
      } catch (err) {
        alert('Lỗi: ' + err.message);
      }
    },
    [table, tableId]
  );

  // Dynamic columns configuration for DataTable
  const tableColumns = useMemo(() => {
    if (!table || !Array.isArray(table.columns)) return [];

    const cols = table.columns.map((col) => ({
      key: col.key,
      label: col.label,
      sortable: true,
      align: col.type === 'number' || col.type === 'currency' ? 'right' : 'left',
      render: (val) => {
        if (val === undefined || val === null || val === '') {
          return <span style={{ color: 'var(--text-muted)' }}>-</span>;
        }

        if (col.type === 'currency') {
          return <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{formatVND(val)}</span>;
        }

        if (col.type === 'number') {
          return <span style={{ fontWeight: 500 }}>{formatNumber(val)}</span>;
        }

        if (col.type === 'email') {
          return (
            <a href={`mailto:${val}`} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
              {val}
            </a>
          );
        }

        if (col.type === 'phone') {
          return (
            <a href={`tel:${val}`} style={{ color: 'var(--info-text)', fontWeight: 500 }}>
              {val}
            </a>
          );
        }

        return String(val);
      }
    }));

    // Action column (Only visible and accessible for Admin)
    if (isAdmin) {
      cols.push({
        key: 'actions',
        label: 'Thao Tác',
        sortable: false,
        align: 'center',
        width: '110px',
        render: (_, row, index) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <button
              type="button"
              className="btn-icon"
              title="Chỉnh sửa dòng"
              onClick={() => handleOpenEdit(row, index)}
            >
              <Edit2 size={14} />
            </button>
            <button
              type="button"
              className="btn-icon"
              title="Xóa dòng này"
              style={{ color: 'var(--danger)' }}
              onClick={() => handleDeleteRow(index)}
            >
              <Trash2 size={14} />
            </button>
          </div>
        )
      });
    }

    return cols;
  }, [table, isAdmin, handleOpenEdit, handleDeleteRow]);

  // Open modal to add a new row
  const handleOpenAdd = (target = null) => {
    const initial = {};
    table.columns?.forEach((c) => {
      initial[c.key] = '';
    });
    setRowFormData(initial);
    setEditingRowIndex(null);
    setRowInsertTarget(target || { type: 'start', index: 0 });
    setIsModalOpen(true);
  };

  // Save row (add or update)
  const handleSaveRow = async (e) => {
    if (e) e.preventDefault();
    if (!table) return;

    setSavingRow(true);
    try {
      let updatedRows = [...(table.rows || [])];

      if (editingRowIndex !== null && editingRowIndex >= 0) {
        // Update existing row
        updatedRows[editingRowIndex] = {
          ...updatedRows[editingRowIndex],
          ...rowFormData
        };
      } else {
        // Add new row at target index (or top)
        const newRow = {
          id: `row-${Date.now()}`,
          ...rowFormData
        };
        const insertIdx =
          rowInsertTarget && typeof rowInsertTarget.index === 'number'
            ? Math.max(0, Math.min(rowInsertTarget.index, updatedRows.length))
            : 0;
        updatedRows.splice(insertIdx, 0, newRow);
      }

      const targetId = table?.id || tableId;
      const res = await fetchApi(`/api/import-export/dynamic-tables/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          rows: updatedRows,
          rowCount: updatedRows.length
        })
      });

      if (res.success) {
        setTable(res.data);
        setIsModalOpen(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed', { detail: res.data }));
        }
      } else {
        alert(res.error || 'Lỗi khi lưu dữ liệu dòng');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSavingRow(false);
    }
  };

  // Open modal to add new column
  const handleOpenAddCol = (target = null) => {
    setNewColLabel('');
    setNewColType('text');
    setNewColDefaultVal('');
    setColInsertTarget(target || { type: 'end', index: table?.columns?.length || 0, targetLabel: '' });
    setIsAddColModalOpen(true);
  };

  // Save new column (updates columns and all rows)
  const handleSaveColumn = async (e) => {
    if (e) e.preventDefault();
    if (!table) return;

    const trimmedLabel = newColLabel.trim();
    if (!trimmedLabel) {
      alert('Vui lòng nhập tên hiển thị cho cột mới.');
      return;
    }

    setSavingCol(true);
    try {
      // Slugify to create safe key
      const baseSlug = trimmedLabel
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '_')
        .replace(/^_+|_+$/g, '');

      let finalKey = baseSlug || `col_${Date.now().toString(36)}`;
      const existingKeys = new Set((table.columns || []).map((c) => c.key));
      if (existingKeys.has(finalKey)) {
        finalKey = `${finalKey}_${Date.now().toString(36).slice(-4)}`;
      }

      // Compute typed default value
      let defaultVal = newColDefaultVal;
      if (newColType === 'number' || newColType === 'currency') {
        defaultVal = newColDefaultVal !== '' ? Number(newColDefaultVal) : 0;
      }

      const newColumn = {
        key: finalKey,
        label: trimmedLabel,
        type: newColType
      };

      const updatedColumns = [...(table.columns || [])];
      const insertIdx =
        colInsertTarget && typeof colInsertTarget.index === 'number'
          ? Math.max(0, Math.min(colInsertTarget.index, updatedColumns.length))
          : updatedColumns.length;
      updatedColumns.splice(insertIdx, 0, newColumn);

      const updatedRows = (table.rows || []).map((row) => ({
        ...row,
        [finalKey]: defaultVal
      }));

      const targetId = table?.id || tableId;
      const res = await fetchApi(`/api/import-export/dynamic-tables/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          columns: updatedColumns,
          rows: updatedRows,
          rowCount: updatedRows.length
        })
      });

      if (res.success) {
        setTable(res.data);
        setIsAddColModalOpen(false);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed', { detail: res.data }));
        }
      } else {
        alert(res.error || 'Lỗi khi thêm cột mới');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSavingCol(false);
    }
  };

  // Save edited column (name & type)
  const handleSaveEditColumn = async (e) => {
    if (e) e.preventDefault();
    if (!table || !editingCol) return;

    const trimmedLabel = (editingCol.label || '').trim();
    if (!trimmedLabel) {
      alert('Tên cột không được để trống.');
      return;
    }

    setSavingCol(true);
    try {
      const updatedColumns = (table.columns || []).map((col) => {
        if (col.key === editingCol.key) {
          return {
            ...col,
            label: trimmedLabel,
            type: editingCol.type
          };
        }
        return col;
      });

      const targetId = table?.id || tableId;
      const res = await fetchApi(`/api/import-export/dynamic-tables/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          columns: updatedColumns
        })
      });

      if (res.success) {
        setTable(res.data);
        setIsEditColModalOpen(false);
        setEditingCol(null);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed', { detail: res.data }));
        }
      } else {
        alert(res.error || 'Lỗi khi cập nhật cột');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSavingCol(false);
    }
  };

  // Delete an existing column
  const handleDeleteColumn = async (colKey, colLabel) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa cột "${colLabel}"? Toàn bộ dữ liệu của cột này trên tất cả các dòng sẽ bị mất.`)) {
      return;
    }

    try {
      const updatedColumns = (table.columns || []).filter((c) => c.key !== colKey);
      const updatedRows = (table.rows || []).map((row) => {
        const copy = { ...row };
        delete copy[colKey];
        return copy;
      });

      const targetId = table?.id || tableId;
      const res = await fetchApi(`/api/import-export/dynamic-tables/${targetId}`, {
        method: 'PUT',
        body: JSON.stringify({
          columns: updatedColumns,
          rows: updatedRows,
          rowCount: updatedRows.length
        })
      });

      if (res.success) {
        setTable(res.data);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed', { detail: res.data }));
        }
      } else {
        alert(res.error || 'Lỗi khi xóa cột');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Delete entire table
  const handleDeleteTable = async () => {
    if (!confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn bảng dữ liệu "${table?.title}"? Hành động này không thể hoàn tác.`)) {
      return;
    }

    try {
      const targetId = table?.id || tableId;
      const res = await fetchApi(`/api/import-export/dynamic-tables/${targetId}`, {
        method: 'DELETE'
      });

      if (res.success) {
        // Dispatch event so sidebar updates
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed'));
        }
        router.push('/data-hub');
      } else {
        alert(res.error || 'Lỗi khi xóa bảng');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    }
  };

  // Export to Excel
  const handleExport = () => {
    if (!table || !table.rows) return;
    exportToExcel(table.rows, table.title || 'bang-du-lieu');
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="skeleton-shimmer skeleton-text" style={{ width: '120px', height: '20px' }} />
        </div>
        <div className="card" style={{ height: '380px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="skeleton-shimmer skeleton-text" style={{ width: '40%', height: '24px' }} />
          <div className="skeleton-shimmer skeleton-text" style={{ width: '60%', height: '16px' }} />
          <div className="skeleton-shimmer" style={{ width: '100%', flex: 1, borderRadius: 'var(--radius-md)', marginTop: '1rem' }} />
        </div>
      </div>
    );
  }

  if (error || !table) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <AlertCircle size={40} color="var(--danger)" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {error || 'Không tìm thấy bảng dữ liệu'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Bảng này có thể đã bị xóa hoặc đường dẫn không chính xác.
        </p>
        <Link href="/data-hub" className="btn btn-primary btn-sm">
          <ArrowLeft size={16} /> Quay lại Trung Tâm Dữ Liệu
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Link href="/data-hub" className="btn btn-secondary btn-sm" title="Quay lại Hub">
            <ArrowLeft size={15} />
            Data Hub
          </Link>
          <span style={{ color: 'var(--text-muted)' }}>/</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Database size={18} color="var(--accent)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {table.title}
            </h2>
          </div>
          <span className="badge badge-primary">{table.rowCount || table.rows?.length || 0} dòng</span>

          {/* Sharing Status Badge */}
          {table.sharedWith === 'all' || !table.sharedWith || (Array.isArray(table.sharedWith) && table.sharedWith.includes('all')) ? (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                fontWeight: 600,
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title="Bảng này được chia sẻ công khai cho tất cả nhân sự trong CRM"
            >
              <Globe size={11} /> Chia sẻ: Tất cả
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                background: 'rgba(59, 130, 246, 0.12)',
                color: 'var(--info-text)',
                fontWeight: 600,
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
              title={`Bảng này chỉ chia sẻ cho ${table.sharedWith.length} người dùng được chỉ định`}
            >
              <Users size={11} /> Chia sẻ: {table.sharedWith.length} người
            </span>
          )}

          {!isAdmin && (
            <span
              style={{
                fontSize: '0.72rem',
                padding: '0.15rem 0.5rem',
                borderRadius: '999px',
                background: 'rgba(234, 179, 8, 0.15)',
                color: 'var(--warning)',
                fontWeight: 600,
                border: '1px solid rgba(234, 179, 8, 0.3)'
              }}
            >
              Chỉ xem (Read-only)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={15} />}
            onClick={handleExport}
          >
            Xuất Excel
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="secondary"
                size="sm"
                icon={<Share2 size={15} color="var(--accent)" />}
                onClick={() => setIsShareModalOpen(true)}
                title="Chia sẻ liên kết theo danh sách người dùng hoặc tất cả, và sửa tên link"
              >
                Chia Sẻ & Sửa Link
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<Columns size={15} />}
                onClick={handleOpenAddCol}
                title="Thêm một cột dữ liệu mới vào bảng"
              >
                Thêm Cột
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={<SlidersHorizontal size={14} />}
                onClick={() => setIsManageColsModalOpen(true)}
                title="Xem và quản lý cấu trúc các cột"
              >
                Quản Lý Cột ({table.columns?.length || 0})
              </Button>

              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={15} />}
                onClick={handleOpenAdd}
                title="Thêm dòng dữ liệu mới vào bảng"
              >
                Thêm Dòng Mới
              </Button>

              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 size={15} />}
                onClick={handleDeleteTable}
                title="Xóa vĩnh viễn bảng dữ liệu này"
              >
                Xóa Bảng
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Meta Information Bar */}
      <div
        className="card card-glass"
        style={{
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileSpreadsheet size={15} color="var(--accent)" />
            <span>Tệp nguồn: <strong>{table.sourceFileName || 'Dữ liệu nhập'}</strong></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} style={{ opacity: 0.7 }} />
            <span>Ngày tạo: <strong>{formatDateTime(table.importedAt)}</strong></span>
          </div>

          {table.importedBy && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={15} style={{ opacity: 0.7 }} />
              <span>Người tạo: <strong>{table.importedBy}</strong></span>
            </div>
          )}
        </div>

        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Được lưu trữ trên Supabase Cloud Database
        </div>
      </div>

      {/* Main Interactive DataTable */}
      <DataTable
        columns={tableColumns}
        data={table.rows || []}
        loading={loading}
        searchPlaceholder={`Tìm kiếm trong ${table.title}...`}
        exportFileName={table.title?.toLowerCase().replace(/\s+/g, '-')}
        emptyMessage="Bảng này hiện chưa có dòng dữ liệu nào"
        defaultPageSize={10}
        adminSheetMode={isAdmin}
        showRowNumbers={true}
        onInsertColumnLeft={(colKey, colIndex, col) => {
          handleOpenAddCol({
            type: 'left',
            index: colIndex,
            targetLabel: col.label
          });
        }}
        onInsertColumnRight={(colKey, colIndex, col) => {
          handleOpenAddCol({
            type: 'right',
            index: colIndex + 1,
            targetLabel: col.label
          });
        }}
        onEditColumn={(colKey, colIndex, col) => {
          setEditingCol({
            key: colKey,
            label: col.label,
            type: col.type || 'text',
            index: colIndex
          });
          setIsEditColModalOpen(true);
        }}
        onDeleteColumn={(colKey, colIndex, col) => {
          handleDeleteColumn(colKey, col.label);
        }}
        onInsertRowAbove={(rowIndex) => {
          handleOpenAdd({
            type: 'above',
            index: rowIndex
          });
        }}
        onInsertRowBelow={(rowIndex) => {
          handleOpenAdd({
            type: 'below',
            index: rowIndex + 1
          });
        }}
        onEditRow={(rowIndex, row) => {
          handleOpenEdit(row, rowIndex);
        }}
        onDeleteRow={(rowIndex, row) => {
          handleDeleteRow(rowIndex, row);
        }}
      />

      {/* Add / Edit Row Modal (Admin Only) */}
      {isAdmin && (
        <>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={
              editingRowIndex !== null
                ? 'Chỉnh Sửa Dòng Dữ Liệu'
                : rowInsertTarget?.type === 'above'
                ? `Chèn 1 Hàng Lên Trên (Vị trí #${(rowInsertTarget?.index || 0) + 1})`
                : rowInsertTarget?.type === 'below'
                ? `Chèn 1 Hàng Xuống Dưới (Vị trí #${(rowInsertTarget?.index || 0) + 1})`
                : 'Thêm Dòng Dữ Liệu Mới'
            }
            subtitle={`Nhập các trường tương ứng cho bảng ${table.title}`}
            maxWidth="640px"
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={savingRow} onClick={handleSaveRow}>
                  {editingRowIndex !== null ? 'Cập Nhật Dòng' : 'Thêm Vào Bảng'}
                </Button>
              </>
            }
          >
            <form onSubmit={handleSaveRow} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {table.columns?.map((col) => (
                <div
                  key={col.key}
                  className="form-group"
                  style={{
                    gridColumn: col.type === 'text' && String(rowFormData[col.key] || '').length > 30 ? 'span 2' : 'span 1'
                  }}
                >
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>{col.label}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {col.type}
                    </span>
                  </label>
                  <input
                    type={
                      col.type === 'number' || col.type === 'currency'
                        ? 'number'
                        : col.type === 'date'
                        ? 'date'
                        : col.type === 'email'
                        ? 'email'
                        : col.type === 'phone'
                        ? 'tel'
                        : 'text'
                    }
                    className="form-input"
                    placeholder={`Nhập ${col.label.toLowerCase()}...`}
                    value={rowFormData[col.key] !== undefined ? rowFormData[col.key] : ''}
                    onChange={(e) =>
                      setRowFormData({
                        ...rowFormData,
                        [col.key]: col.type === 'number' || col.type === 'currency' ? Number(e.target.value) : e.target.value
                      })
                    }
                  />
                </div>
              ))}
            </form>
          </Modal>

          {/* Add Column Modal (Admin Only) */}
          <Modal
            isOpen={isAddColModalOpen}
            onClose={() => setIsAddColModalOpen(false)}
            title={
              colInsertTarget?.type === 'left'
                ? `Chèn Cột Bên Trái "${colInsertTarget.targetLabel}"`
                : colInsertTarget?.type === 'right'
                ? `Chèn Cột Bên Phải "${colInsertTarget.targetLabel}"`
                : 'Thêm Cột Dữ Liệu Mới'
            }
            subtitle={
              colInsertTarget?.type === 'left'
                ? `Cột mới sẽ nằm ngay trước cột "${colInsertTarget.targetLabel}". Áp dụng cho toàn bộ ${table.rowCount || table.rows?.length || 0} dòng.`
                : colInsertTarget?.type === 'right'
                ? `Cột mới sẽ nằm ngay sau cột "${colInsertTarget.targetLabel}". Áp dụng cho toàn bộ ${table.rowCount || table.rows?.length || 0} dòng.`
                : `Thêm một cột mới vào bảng ${table.title}. Cột sẽ được áp dụng cho toàn bộ ${table.rowCount || table.rows?.length || 0} dòng hiện có.`
            }
            maxWidth="520px"
            footer={
              <>
                <Button variant="secondary" onClick={() => setIsAddColModalOpen(false)}>
                  Hủy
                </Button>
                <Button variant="primary" loading={savingCol} onClick={handleSaveColumn}>
                  {colInsertTarget?.type === 'left' || colInsertTarget?.type === 'right' ? 'Chèn Cột' : 'Thêm Cột Vào Bảng'}
                </Button>
              </>
            }
          >
            <form onSubmit={handleSaveColumn} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div className="form-group">
                <label className="form-label">
                  Tên Cột Hiển Thị <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Ghi Chú Đơn Hàng, Khu Vực, Mức Chiết Khấu..."
                  value={newColLabel}
                  onChange={(e) => setNewColLabel(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Định Dạng / Kiểu Dữ Liệu</label>
                <select
                  className="form-select"
                  value={newColType}
                  onChange={(e) => setNewColType(e.target.value)}
                >
                  <option value="text">📝 Văn bản (Chuỗi ký tự, chữ)</option>
                  <option value="number">🔢 Số (Số lượng, số nguyên, thập phân)</option>
                  <option value="currency">💰 Tiền tệ VNĐ (Tự động định dạng đ)</option>
                  <option value="date">📅 Ngày tháng (YYYY-MM-DD)</option>
                  <option value="phone">📞 Số điện thoại</option>
                  <option value="email">✉️ Địa chỉ Email</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Giá Trị Mặc Định Cho Các Dòng Hiện Có (Tùy chọn)</label>
                <input
                  type={
                    newColType === 'number' || newColType === 'currency'
                      ? 'number'
                      : newColType === 'date'
                      ? 'date'
                      : newColType === 'email'
                      ? 'email'
                      : newColType === 'phone'
                      ? 'tel'
                      : 'text'
                  }
                  className="form-input"
                  placeholder={
                    newColType === 'currency'
                      ? '0'
                      : newColType === 'number'
                      ? '0'
                      : 'Để trống nếu không có giá trị mặc định'
                  }
                  value={newColDefaultVal}
                  onChange={(e) => setNewColDefaultVal(e.target.value)}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                  Giá trị này sẽ tự động gán cho toàn bộ các dòng hiện có khi tạo cột mới.
                </span>
              </div>
            </form>
          </Modal>

          {/* Manage Columns Modal (Admin Only) */}
          <Modal
            isOpen={isManageColsModalOpen}
            onClose={() => setIsManageColsModalOpen(false)}
            title={`Cấu Trúc Cột (${table.columns?.length || 0} cột)`}
            subtitle={`Xem cấu trúc và quản lý các trường dữ liệu trong bảng ${table.title}`}
            maxWidth="580px"
            footer={
              <>
                <Button
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => {
                    setIsManageColsModalOpen(false);
                    handleOpenAddCol();
                  }}
                >
                  Thêm Cột Mới
                </Button>
                <Button variant="secondary" onClick={() => setIsManageColsModalOpen(false)}>
                  Đóng
                </Button>
              </>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: '420px', overflowY: 'auto' }}>
              {table.columns?.map((col, idx) => (
                <div
                  key={col.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: 'var(--bg-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--text-muted)'
                      }}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {col.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        Khóa: {col.key}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '999px',
                        fontWeight: 600,
                        background:
                          col.type === 'currency'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : col.type === 'number'
                            ? 'rgba(59, 130, 246, 0.15)'
                            : col.type === 'date'
                            ? 'rgba(234, 179, 8, 0.15)'
                            : 'rgba(255, 255, 255, 0.08)',
                        color:
                          col.type === 'currency'
                            ? 'var(--success)'
                            : col.type === 'number'
                            ? 'var(--info-text)'
                            : col.type === 'date'
                            ? 'var(--warning)'
                            : 'var(--text-secondary)'
                      }}
                    >
                      {col.type === 'currency'
                        ? 'Tiền tệ (VNĐ)'
                        : col.type === 'number'
                        ? 'Số'
                        : col.type === 'date'
                        ? 'Ngày tháng'
                        : col.type === 'email'
                        ? 'Email'
                        : col.type === 'phone'
                        ? 'Số ĐT'
                        : 'Văn bản'}
                    </span>

                    <button
                      type="button"
                      className="btn-icon"
                      title={`Đổi tên và kiểu dữ liệu cột "${col.label}"`}
                      style={{ padding: '0.35rem' }}
                      onClick={() => {
                        setIsManageColsModalOpen(false);
                        setEditingCol({
                          key: col.key,
                          label: col.label,
                          type: col.type || 'text',
                          index: idx
                        });
                        setIsEditColModalOpen(true);
                      }}
                    >
                      <Edit2 size={15} />
                    </button>

                    <button
                      type="button"
                      className="btn-icon"
                      title={`Xóa cột "${col.label}" khỏi bảng`}
                      style={{ color: 'var(--danger)', padding: '0.35rem' }}
                      onClick={() => handleDeleteColumn(col.key, col.label)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Modal>

          {/* Edit Column Modal (Admin Only) */}
          <Modal
            isOpen={isEditColModalOpen}
            onClose={() => {
              setIsEditColModalOpen(false);
              setEditingCol(null);
            }}
            title={editingCol ? `Đổi Tên & Định Dạng Cột "${editingCol.label}"` : 'Chỉnh Sửa Cột'}
            subtitle={`Thay đổi tên hiển thị hoặc kiểu dữ liệu cho cột trong bảng ${table.title}`}
            maxWidth="500px"
            footer={
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditColModalOpen(false);
                    setEditingCol(null);
                  }}
                >
                  Hủy
                </Button>
                <Button variant="primary" loading={savingCol} onClick={handleSaveEditColumn}>
                  Lưu Thay Đổi
                </Button>
              </>
            }
          >
            {editingCol && (
              <form onSubmit={handleSaveEditColumn} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    Tên Cột Hiển Thị <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingCol.label || ''}
                    onChange={(e) => setEditingCol({ ...editingCol, label: e.target.value })}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Định Dạng / Kiểu Dữ Liệu</label>
                  <select
                    className="form-select"
                    value={editingCol.type || 'text'}
                    onChange={(e) => setEditingCol({ ...editingCol, type: e.target.value })}
                  >
                    <option value="text">📝 Văn bản (Chuỗi ký tự, chữ)</option>
                    <option value="number">🔢 Số (Số lượng, số nguyên, thập phân)</option>
                    <option value="currency">💰 Tiền tệ VNĐ (Tự động định dạng đ)</option>
                    <option value="date">📅 Ngày tháng (YYYY-MM-DD)</option>
                    <option value="phone">📞 Số điện thoại</option>
                    <option value="email">✉️ Địa chỉ Email</option>
                  </select>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Mã khóa nhận diện cột: <code>{editingCol.key}</code>
                </div>
              </form>
            )}
          </Modal>

          {/* Share & Rename Link Modal (Admin Only) */}
          <ShareTableModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            table={table}
            onSaved={(updated) => {
              setTable(updated);
              if (updated?.slug && updated.slug !== tableId) {
                router.replace(`/data-hub/tables/${updated.slug}`);
              }
            }}
          />
        </>
      )}
    </div>
  );
}
