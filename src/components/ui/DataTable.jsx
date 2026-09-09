'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUpDown,
  Download,
  Loader2,
  Inbox,
  Filter,
  FilterX,
  ChevronDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2
} from 'lucide-react';
import Button from './Button';
import { exportToExcel } from '@/lib/excel';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  searchable = true,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  columnFilterable = true,
  exportable = true,
  exportFileName = 'du-lieu',
  actions = null,
  emptyMessage = 'Không có dữ liệu hiển thị',
  pageSizeOptions = [10, 25, 50],
  defaultPageSize = 10,
  // Google Sheets Spreadsheet Mode Props (Admin Only)
  adminSheetMode = false,
  showRowNumbers = false,
  onInsertColumnLeft = null,
  onInsertColumnRight = null,
  onEditColumn = null,
  onDeleteColumn = null,
  onInsertRowAbove = null,
  onInsertRowBelow = null,
  onEditRow = null,
  onDeleteRow = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [showColumnFilters, setShowColumnFilters] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [activeColMenu, setActiveColMenu] = useState(null);
  const [activeRowMenu, setActiveRowMenu] = useState(null);

  // Close menus on outside click or window resize
  useEffect(() => {
    const handleClose = () => {
      setActiveColMenu(null);
      setActiveRowMenu(null);
    };
    window.addEventListener('click', handleClose);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('resize', handleClose);
    };
  }, []);

  // Active column filters count
  const activeFiltersCount = useMemo(() => {
    return Object.values(columnFilters).filter((v) => v && v.trim()).length;
  }, [columnFilters]);

  // Combined Filter: Global Search + Per-Column Search
  const filteredData = useMemo(() => {
    let list = data;

    // 1. Global Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter((item) => {
        return Object.values(item).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(term);
        });
      });
    }

    // 2. Per-column Search Filters
    const activeKeys = Object.keys(columnFilters).filter((k) => columnFilters[k]?.trim());
    if (activeKeys.length > 0) {
      list = list.filter((item) => {
        return activeKeys.every((key) => {
          const filterVal = columnFilters[key].toLowerCase().trim();
          const itemVal = item[key];
          if (itemVal === null || itemVal === undefined) return false;
          return String(itemVal).toLowerCase().includes(filterVal);
        });
      });
    }

    return list;
  }, [data, searchTerm, columnFilters]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB), 'vi')
        : String(valB).localeCompare(String(valA), 'vi');
    });
  }, [filteredData, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleExport = () => {
    // Transform into clean export data using columns
    const exportRows = sortedData.map((row) => {
      const item = {};
      columns.forEach((col) => {
        item[col.label] = row[col.key] !== undefined ? row[col.key] : '';
      });
      return item;
    });

    exportToExcel(exportRows, exportFileName);
  };

  return (
    <div className="card" style={{ padding: '1rem' }}>
      {/* Top Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: '240px', flexWrap: 'wrap' }}>
          {searchable && (
            <div className="search-box" style={{ width: '100%', maxWidth: '320px', position: 'relative' }}>
              <Search size={16} />
              <input
                type="text"
                className="form-input"
                placeholder={searchPlaceholder}
                value={searchTerm}
                disabled={loading}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

          {columnFilterable && (
            <button
              type="button"
              className={`btn btn-sm ${showColumnFilters || activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setShowColumnFilters(!showColumnFilters)}
              style={{ gap: '0.4rem', whiteSpace: 'nowrap' }}
              title="Bật/tắt thanh tìm kiếm giá trị chi tiết theo từng cột"
            >
              <Filter size={14} />
              <span>Lọc Cột</span>
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    background: '#fff',
                    color: 'var(--accent)',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 700
                  }}
                >
                  {activeFiltersCount}
                </span>
              )}
            </button>
          )}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setColumnFilters({});
                setCurrentPage(1);
              }}
              style={{ gap: '0.35rem', color: 'var(--danger)', fontSize: '0.8rem' }}
              title="Xóa tất cả bộ lọc theo từng cột"
            >
              <FilterX size={13} />
              Xóa Lọc ({activeFiltersCount})
            </button>
          )}

          {loading && (
            <div
              className="loading-badge"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.8rem',
                fontWeight: 500
              }}
            >
              <Loader2 size={13} className="spinner-icon" />
              <span>Đang tải dữ liệu...</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {exportable && data.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download size={15} />}
              onClick={handleExport}
              disabled={loading}
              title="Xuất bảng ra file Excel"
            >
              Xuất Excel
            </Button>
          )}
          {actions}
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {(adminSheetMode || showRowNumbers) && (
                <th
                  style={{
                    width: '54px',
                    textAlign: 'center',
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    background: 'var(--bg-surface)'
                  }}
                  title="Số thứ tự hàng"
                >
                  #
                </th>
              )}
              {columns.map((col, cIdx) => (
                <th
                  key={col.key}
                  onClick={() => !loading && col.sortable !== false && handleSort(col.key)}
                  onContextMenu={(e) => {
                    if (!adminSheetMode || col.key === 'actions') return;
                    e.preventDefault();
                    setActiveColMenu({
                      colKey: col.key,
                      colLabel: col.label,
                      colIndex: cIdx,
                      col,
                      x: Math.min(e.clientX, window.innerWidth - 230),
                      y: Math.min(e.clientY, window.innerHeight - 240)
                    });
                    setActiveRowMenu(null);
                  }}
                  style={{
                    cursor: !loading && col.sortable !== false ? 'pointer' : 'default',
                    userSelect: 'none',
                    textAlign: col.align || 'left',
                    width: col.width || 'auto'
                  }}
                >
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      justifyContent: 'space-between',
                      width: '100%'
                    }}
                  >
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        justifyContent: col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                        flex: 1
                      }}
                    >
                      <span>{col.label}</span>
                      {col.sortable !== false && (
                        <ArrowUpDown
                          size={12}
                          style={{
                            opacity: sortKey === col.key ? 1 : 0.35,
                            color: sortKey === col.key ? 'var(--accent)' : 'inherit'
                          }}
                        />
                      )}
                    </div>

                    {adminSheetMode && col.key !== 'actions' && (
                      <button
                        type="button"
                        className="btn-icon"
                        style={{
                          width: '20px',
                          height: '20px',
                          padding: 0,
                          opacity: activeColMenu?.colKey === col.key ? 1 : 0.6,
                          borderRadius: 'var(--radius-sm)',
                          background: activeColMenu?.colKey === col.key ? 'var(--accent-light)' : 'transparent',
                          color: activeColMenu?.colKey === col.key ? 'var(--accent)' : 'inherit',
                          flexShrink: 0
                        }}
                        title={`Thao tác cột "${col.label}" (Thêm trái/phải, xóa cột...)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveColMenu(activeColMenu?.colKey === col.key ? null : {
                            colKey: col.key,
                            colLabel: col.label,
                            colIndex: cIdx,
                            col,
                            x: Math.min(rect.left, window.innerWidth - 230),
                            y: rect.bottom + 4
                          });
                          setActiveRowMenu(null);
                        }}
                      >
                        <ChevronDown size={13} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>

            {/* Per-Column Search Filter Row */}
            {showColumnFilters && (
              <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
                {(adminSheetMode || showRowNumbers) && (
                  <th style={{ width: '54px', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    -
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={`filter-${col.key}`}
                    style={{
                      padding: '0.4rem 0.5rem',
                      width: col.width || 'auto',
                      fontWeight: 'normal',
                      textAlign: col.align || 'left'
                    }}
                  >
                    {col.key !== 'actions' ? (
                      <div style={{ position: 'relative', width: '100%' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder={`Lọc ${col.label.toLowerCase()}...`}
                          value={columnFilters[col.key] || ''}
                          disabled={loading}
                          onChange={(e) => {
                            setColumnFilters({
                              ...columnFilters,
                              [col.key]: e.target.value
                            });
                            setCurrentPage(1);
                          }}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.25rem 0.5rem',
                            paddingRight: columnFilters[col.key] ? '1.5rem' : '0.5rem',
                            height: '28px',
                            width: '100%',
                            minWidth: '80px',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        />
                        {columnFilters[col.key] && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...columnFilters };
                              delete next[col.key];
                              setColumnFilters(next);
                              setCurrentPage(1);
                            }}
                            style={{
                              position: 'absolute',
                              right: '6px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--text-muted)',
                              fontSize: '11px',
                              lineHeight: 1,
                              padding: '2px'
                            }}
                            title="Xóa lọc cột này"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>-</span>
                    )}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {loading ? (
              // Skeleton rows when loading
              Array.from({ length: Math.min(pageSize, 6) }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`}>
                  {(adminSheetMode || showRowNumbers) && (
                    <td style={{ width: '54px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {rIdx + 1}
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td
                      key={`skeleton-col-${cIdx}`}
                      style={{
                        textAlign: col.align || 'left',
                        padding: '1rem 0.75rem'
                      }}
                    >
                      <div
                        className="skeleton-shimmer skeleton-text"
                        style={{
                          width:
                            cIdx === 0
                              ? '50%'
                              : cIdx === 1
                              ? '80%'
                              : cIdx === columns.length - 1
                              ? '45%'
                              : '70%',
                          maxWidth: '180px',
                          display: col.align === 'right' ? 'inline-block' : 'block',
                          marginLeft: col.align === 'right' ? 'auto' : undefined
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (adminSheetMode || showRowNumbers ? 1 : 0)}
                  style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Inbox size={32} style={{ opacity: 0.4 }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, index) => {
                const actualRowIndex = (currentPage - 1) * pageSize + index;
                const isRowMenuActive = activeRowMenu?.rowIndex === actualRowIndex;

                return (
                  <tr key={row.id || index}>
                    {(adminSheetMode || showRowNumbers) && (
                      <td
                        style={{
                          textAlign: 'center',
                          width: '54px',
                          color: isRowMenuActive ? 'var(--accent)' : 'var(--text-muted)',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          background: isRowMenuActive ? 'var(--accent-light)' : 'var(--bg-surface)',
                          userSelect: 'none',
                          cursor: adminSheetMode ? 'pointer' : 'default',
                          transition: 'all 0.15s ease'
                        }}
                        onContextMenu={(e) => {
                          if (!adminSheetMode) return;
                          e.preventDefault();
                          setActiveRowMenu({
                            rowIndex: actualRowIndex,
                            row,
                            x: Math.min(e.clientX, window.innerWidth - 230),
                            y: Math.min(e.clientY, window.innerHeight - 220)
                          });
                          setActiveColMenu(null);
                        }}
                        onClick={(e) => {
                          if (!adminSheetMode) return;
                          e.stopPropagation();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setActiveRowMenu(isRowMenuActive ? null : {
                            rowIndex: actualRowIndex,
                            row,
                            x: Math.min(rect.right + 4, window.innerWidth - 230),
                            y: Math.min(rect.top, window.innerHeight - 220)
                          });
                          setActiveColMenu(null);
                        }}
                        title={adminSheetMode ? `Click hoặc chuột phải để thao tác hàng #${actualRowIndex + 1} (Thêm trên/dưới, sửa, xóa...)` : undefined}
                      >
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                          <span>{actualRowIndex + 1}</span>
                          {adminSheetMode && <ChevronDown size={11} style={{ opacity: 0.5 }} />}
                        </div>
                      </td>
                    )}
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        style={{
                          textAlign: col.align || 'left',
                          whiteSpace: col.noWrap ? 'nowrap' : 'normal'
                        }}
                      >
                        {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & Summary */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          marginTop: '1rem',
          fontSize: '0.84rem',
          color: 'var(--text-secondary)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>Hiển thị</span>
          <select
            className="form-select"
            style={{ width: '70px', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
            value={pageSize}
            disabled={loading}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>
            {loading ? 'Đang kiểm tra...' : `/ ${sortedData.length} kết quả`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>
            Trang {currentPage} / {loading ? '...' : totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            icon={<ChevronLeft size={15} />}
            aria-label="Trang trước"
          />
          <Button
            variant="secondary"
            size="sm"
            disabled={loading || currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            icon={<ChevronRight size={15} />}
            aria-label="Trang sau"
          />
        </div>
      </div>

      {/* Google Sheets Column Context Menu (Admin Only) */}
      {adminSheetMode && activeColMenu && (
        <div
          style={{
            position: 'fixed',
            top: activeColMenu.y,
            left: activeColMenu.x,
            zIndex: 9999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            padding: '0.35rem 0',
            minWidth: '210px',
            fontSize: '0.84rem',
            color: 'var(--text-primary)',
            animation: 'fadeIn 0.1s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-subtle)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Cột: {activeColMenu.colLabel}
          </div>

          {onInsertColumnLeft && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)'
              }}
              onClick={() => {
                const { colKey, colIndex, col } = activeColMenu;
                setActiveColMenu(null);
                onInsertColumnLeft(colKey, colIndex, col);
              }}
            >
              <ArrowLeft size={15} style={{ color: 'var(--accent)' }} />
              <span>Chèn 1 cột bên trái</span>
            </button>
          )}

          {onInsertColumnRight && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)'
              }}
              onClick={() => {
                const { colKey, colIndex, col } = activeColMenu;
                setActiveColMenu(null);
                onInsertColumnRight(colKey, colIndex, col);
              }}
            >
              <ArrowRight size={15} style={{ color: 'var(--accent)' }} />
              <span>Chèn 1 cột bên phải</span>
            </button>
          )}

          {onEditColumn && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)'
              }}
              onClick={() => {
                const { colKey, colIndex, col } = activeColMenu;
                setActiveColMenu(null);
                onEditColumn(colKey, colIndex, col);
              }}
            >
              <Edit2 size={15} style={{ color: 'var(--text-secondary)' }} />
              <span>Đổi tên & định dạng cột</span>
            </button>
          )}

          {columnFilterable && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                borderTop: '1px solid var(--border-subtle)'
              }}
              onClick={() => {
                setShowColumnFilters(true);
                setActiveColMenu(null);
              }}
            >
              <Filter size={15} style={{ color: 'var(--text-secondary)' }} />
              <span>Mở bộ lọc cột</span>
            </button>
          )}

          {onDeleteColumn && (
            <button
              type="button"
              className="dropdown-item text-danger"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--danger)',
                borderTop: '1px solid var(--border-subtle)'
              }}
              onClick={() => {
                const { colKey, colIndex, col } = activeColMenu;
                setActiveColMenu(null);
                onDeleteColumn(colKey, colIndex, col);
              }}
            >
              <Trash2 size={15} />
              <span>Xóa cột này</span>
            </button>
          )}
        </div>
      )}

      {/* Google Sheets Row Context Menu (Admin Only) */}
      {adminSheetMode && activeRowMenu && (
        <div
          style={{
            position: 'fixed',
            top: activeRowMenu.y,
            left: activeRowMenu.x,
            zIndex: 9999,
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            padding: '0.35rem 0',
            minWidth: '200px',
            fontSize: '0.84rem',
            color: 'var(--text-primary)',
            animation: 'fadeIn 0.1s ease-out'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: '0.4rem 0.85rem',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-subtle)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Hàng #{activeRowMenu.rowIndex + 1}
          </div>

          {onInsertRowAbove && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)'
              }}
              onClick={() => {
                const { rowIndex, row } = activeRowMenu;
                setActiveRowMenu(null);
                onInsertRowAbove(rowIndex, row);
              }}
            >
              <ArrowUp size={15} style={{ color: 'var(--accent)' }} />
              <span>Chèn 1 hàng lên trên</span>
            </button>
          )}

          {onInsertRowBelow && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)'
              }}
              onClick={() => {
                const { rowIndex, row } = activeRowMenu;
                setActiveRowMenu(null);
                onInsertRowBelow(rowIndex, row);
              }}
            >
              <ArrowDown size={15} style={{ color: 'var(--accent)' }} />
              <span>Chèn 1 hàng xuống dưới</span>
            </button>
          )}

          {onEditRow && (
            <button
              type="button"
              className="dropdown-item"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--text-primary)',
                borderTop: '1px solid var(--border-subtle)'
              }}
              onClick={() => {
                const { rowIndex, row } = activeRowMenu;
                setActiveRowMenu(null);
                onEditRow(rowIndex, row);
              }}
            >
              <Edit2 size={15} style={{ color: 'var(--text-secondary)' }} />
              <span>Chỉnh sửa hàng</span>
            </button>
          )}

          {onDeleteRow && (
            <button
              type="button"
              className="dropdown-item text-danger"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.5rem 0.85rem',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '0.82rem',
                color: 'var(--danger)',
                borderTop: '1px solid var(--border-subtle)'
              }}
              onClick={() => {
                const { rowIndex, row } = activeRowMenu;
                setActiveRowMenu(null);
                onDeleteRow(rowIndex, row);
              }}
            >
              <Trash2 size={15} />
              <span>Xóa hàng này</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
