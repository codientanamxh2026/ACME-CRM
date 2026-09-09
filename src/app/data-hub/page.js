'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Database,
  Plus,
  Table,
  CheckCircle,
  Eye,
  Trash2,
  Package,
  Users,
  ShoppingBag,
  Sparkles,
  ExternalLink,
  Layers,
  Lock,
  ShieldAlert,
  Share2,
  Globe,
  Edit3
} from 'lucide-react';
import Dropzone from '@/components/data-hub/Dropzone';
import DynamicTableViewer from '@/components/data-hub/DynamicTableViewer';
import SmartColumnMapper from '@/components/data-hub/SmartColumnMapper';
import ShareTableModal from '@/components/data-hub/ShareTableModal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { fetchApi } from '@/lib/api';
import { exportToExcel } from '@/lib/excel';
import { formatDateTime } from '@/lib/formatters';

export default function DataHubPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'saved' | 'export_center'
  const [parsedDataset, setParsedDataset] = useState(null);
  const [importChoice, setImportChoice] = useState('new'); // 'new' | 'existing'
  const [isParsing, setIsParsing] = useState(false);
  const [savedTables, setSavedTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [selectedSavedTable, setSelectedSavedTable] = useState(null);
  const [sharingTable, setSharingTable] = useState(null);

  const loadSavedTables = useCallback(async () => {
    setLoadingTables(true);
    const res = await fetchApi('/api/import-export/dynamic-tables');
    if (res.success) {
      setSavedTables(res.data);
    }
    setLoadingTables(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchApi('/api/import-export/dynamic-tables').then((res) => {
      if (!ignore) {
        if (res.success) setSavedTables(res.data);
        setLoadingTables(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  const handleFileParsed = (result) => {
    setIsParsing(false);
    setParsedDataset(result);
    setSelectedSavedTable(null);
  };

  const handleResetImport = () => {
    setParsedDataset(null);
    setSelectedSavedTable(null);
  };

  const handleTableSaved = (newTable) => {
    loadSavedTables();
  };

  const handleDeleteSavedTable = async (id, title) => {
    if (!confirm(`Bạn có chắc muốn xóa bảng dữ liệu "${title}"?`)) return;

    const res = await fetchApi(`/api/import-export/dynamic-tables/${id}`, { method: 'DELETE' });
    if (res.success) {
      if (selectedSavedTable?.id === id) {
        setSelectedSavedTable(null);
      }
      loadSavedTables();
    } else {
      alert(res.error || 'Lỗi khi xóa bảng');
    }
  };

  // Export Center handlers
  const handleExportEntity = async (entity) => {
    let data = [];
    let fileName = '';

    if (entity === 'customers') {
      const res = await fetchApi('/api/customers');
      if (res.success) {
        data = res.data.map((c) => ({
          'Mã KH': c.code,
          'Tên Doanh Nghiệp / Khách Hàng': c.name,
          'Người Đại Diện': c.contactPerson,
          'Số Điện Thoại': c.phone,
          'Email': c.email,
          'Địa Chỉ': c.address,
          'Nhóm': c.group,
          'Trạng Thái': c.status,
          'Doanh Thu Tích Lũy': c.revenue,
          'Nhân Viên Phụ Trách': c.assignedStaffName
        }));
        fileName = 'danh-sach-khach-hang.xlsx';
      }
    } else if (entity === 'inventory') {
      const res = await fetchApi('/api/products');
      if (res.success) {
        data = res.data.map((p) => ({
          'Mã SKU': p.sku,
          'Tên Sản Phẩm': p.name,
          'Danh Mục': p.category,
          'Đơn Vị Tính': p.unit,
          'Giá Vốn': p.costPrice,
          'Giá Bán Niêm Yết': p.salePrice,
          'Tồn Kho Hiện Tại': p.stock,
          'Ngưỡng Tồn Tối Thiểu': p.minStock,
          'Tình Trạng': p.status
        }));
        fileName = 'danh-muc-kho-hang.xlsx';
      }
    } else if (entity === 'orders') {
      const res = await fetchApi('/api/orders');
      if (res.success) {
        data = res.data.map((o) => ({
          'Mã Đơn Hàng': o.orderNumber,
          'Khách Hàng': o.customerName,
          'Số Lượng Sản Phẩm': o.items?.length || 0,
          'Tổng Tiền Hàng': o.subtotal,
          'Chiết Khấu': o.discount,
          'Thực Thu': o.totalAmount,
          'Phương Thức Thanh Toán': o.paymentMethod,
          'Trạng Thái Đơn': o.status,
          'Thanh Toán': o.paymentStatus,
          'Người Lập': o.createdByName,
          'Ngày Tạo': formatDateTime(o.createdAt)
        }));
        fileName = 'danh-sach-don-hang.xlsx';
      }
    }

    if (data.length > 0) {
      exportToExcel(data, fileName);
    } else {
      alert('Không tìm thấy dữ liệu để xuất file');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--bg-surface)',
          padding: '0.4rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          width: 'fit-content'
        }}
      >
        <button
          onClick={() => {
            setActiveTab('import');
            setSelectedSavedTable(null);
          }}
          className="btn btn-sm"
          style={{
            background: activeTab === 'import' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'import' ? '#fff' : 'var(--text-secondary)',
            gap: '0.4rem',
            padding: '0.5rem 1rem'
          }}
        >
          {isAdmin ? <Sparkles size={15} /> : <Lock size={14} color="var(--warning)" />}
          Nhập File Tự Sinh Bảng (Smart Import)
          {!isAdmin && (
            <span
              style={{
                fontSize: '0.68rem',
                background: 'rgba(234, 179, 8, 0.2)',
                color: 'var(--warning)',
                padding: '0.1rem 0.35rem',
                borderRadius: '4px',
                marginLeft: '0.2rem',
                fontWeight: 600
              }}
            >
              Admin
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'saved' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'saved' ? '#fff' : 'var(--text-secondary)',
            gap: '0.4rem',
            padding: '0.5rem 1rem'
          }}
        >
          <Database size={15} />
          Bảng Dữ Liệu Đã Lưu ({savedTables.length})
        </button>

        <button
          onClick={() => setActiveTab('export_center')}
          className="btn btn-sm"
          style={{
            background: activeTab === 'export_center' ? 'var(--accent)' : 'transparent',
            color: activeTab === 'export_center' ? '#fff' : 'var(--text-secondary)',
            gap: '0.4rem',
            padding: '0.5rem 1rem'
          }}
        >
          <Download size={15} />
          Trung Tâm Xuất File Excel
        </button>
      </div>

      {/* TAB 1: Smart Import */}
      {activeTab === 'import' && (
        <div>
          {!isAdmin ? (
            <div className="card card-glass" style={{ padding: '3.5rem 2rem', textAlign: 'center' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'rgba(234, 179, 8, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                  color: 'var(--warning)'
                }}
              >
                <Lock size={30} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                Tính Năng Chỉ Dành Cho Quản Trị Viên (Admin)
              </h3>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '540px', margin: '0 auto 1.5rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
                Tài khoản của bạn ({user?.name || 'Thành viên'} - Vai trò: <strong>{user?.role || 'staff'}</strong>) có quyền xem dữ liệu và xuất báo cáo.
                Chức năng tải file Excel/CSV để tự động sinh bảng hoặc ghép cột vào hệ thống chỉ dành riêng cho Quản trị viên (Admin).
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Button variant="primary" size="sm" onClick={() => setActiveTab('saved')}>
                  <Database size={15} /> Xem Bảng Dữ Liệu Đã Có ({savedTables.length})
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setActiveTab('export_center')}>
                  <Download size={15} /> Trung Tâm Xuất File Excel
                </Button>
              </div>
            </div>
          ) : !parsedDataset ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="card card-glass">
                <div className="card-header">
                  <div>
                    <div className="card-title">
                      <FileSpreadsheet size={18} color="var(--accent)" />
                      Tải Lên File Excel (.xlsx, .xls) hoặc CSV để Tự Động Sinh Bảng
                    </div>
                    <div className="card-subtitle">
                      Hệ thống tự động phát hiện số cột, tiêu đề, kiểu dữ liệu (tiền tệ, ngày tháng, email, điện thoại) và hiển thị thành bảng thông tin tương tác.
                    </div>
                  </div>
                </div>

                <Dropzone onFileParsed={handleFileParsed} isParsing={isParsing} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Option Mode Bar */}
              <div
                className="card card-glass"
                style={{
                  padding: '0.65rem 1rem',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  Đã tải file <strong>{parsedDataset.fileName}</strong> ({parsedDataset.rowCount} dòng). Chọn hướng xử lý:
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setImportChoice('new')}
                    className={`btn btn-sm ${importChoice === 'new' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ gap: '0.4rem' }}
                  >
                    <Sparkles size={14} />
                    Tạo Bảng Mới Độc Lập
                  </button>

                  <button
                    type="button"
                    onClick={() => setImportChoice('existing')}
                    className={`btn btn-sm ${importChoice === 'existing' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ gap: '0.4rem' }}
                  >
                    <Layers size={14} />
                    Ghép Vào Bảng Cũ (CRM)
                  </button>
                </div>
              </div>

              {importChoice === 'new' ? (
                <DynamicTableViewer
                  dataset={parsedDataset}
                  onReset={handleResetImport}
                  onSaved={handleTableSaved}
                />
              ) : (
                <SmartColumnMapper
                  dataset={parsedDataset}
                  savedTables={savedTables}
                  onSuccess={() => {
                    handleTableSaved();
                  }}
                  onCancel={() => setImportChoice('new')}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Saved Dynamic Tables */}
      {activeTab === 'saved' && (
        <div>
          {selectedSavedTable ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedSavedTable(null)}
                >
                  ← Quay lại danh sách bảng đã lưu
                </Button>
              </div>

              <DynamicTableViewer
                dataset={{
                  fileName: selectedSavedTable.sourceFileName,
                  columns: selectedSavedTable.columns,
                  rows: selectedSavedTable.rows,
                  rowCount: selectedSavedTable.rowCount
                }}
                onReset={() => setSelectedSavedTable(null)}
              />
            </div>
          ) : (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">
                    <Database size={18} color="var(--accent)" />
                    Danh Sách Các Bảng Thông Tin Đã Nhập Từ File
                  </div>
                  <div className="card-subtitle">
                    Các bảng dữ liệu động được lưu giữ an toàn trên máy chủ CRM
                  </div>
                </div>
              </div>

              {loadingTables ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card card-glass" style={{ padding: '1.25rem', height: '160px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div className="skeleton-shimmer skeleton-text" style={{ width: '60%', height: '18px' }} />
                      <div className="skeleton-shimmer skeleton-text" style={{ width: '85%', height: '14px' }} />
                      <div className="skeleton-shimmer skeleton-text" style={{ width: '45%', height: '14px', marginTop: 'auto' }} />
                    </div>
                  ))}
                </div>
              ) : savedTables.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  Chưa có bảng dữ liệu nào được lưu. Hãy chuyển qua tab &quot;Nhập File&quot; để tải lên file đầu tiên!
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                  {savedTables.map((tbl) => (
                    <div
                      key={tbl.id}
                      className="card card-glass"
                      style={{
                        padding: '1.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '1rem'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {tbl.title}
                          </h4>
                          <span className="badge badge-primary">{tbl.rowCount} dòng</span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                          <div>Tệp nguồn: <strong>{tbl.sourceFileName}</strong></div>
                          <div>Nhập ngày: {formatDateTime(tbl.importedAt)}</div>
                          <div>Người nhập: {tbl.importedBy}</div>
                        </div>

                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          {tbl.columns?.slice(0, 4).map((c) => (
                            <span
                              key={c.key}
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.4rem',
                                background: 'var(--bg-elevated)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)'
                              }}
                            >
                              {c.label}
                            </span>
                          ))}
                          {tbl.columns?.length > 4 && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              +{tbl.columns.length - 4} cột khác
                            </span>
                          )}
                        </div>

                        {/* Sharing Status Badge */}
                        <div style={{ marginTop: '0.65rem' }}>
                          {tbl.sharedWith === 'all' || !tbl.sharedWith || (Array.isArray(tbl.sharedWith) && tbl.sharedWith.includes('all')) ? (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                background: 'rgba(16, 185, 129, 0.12)',
                                color: 'var(--success)',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Globe size={11} /> Chia sẻ: Tất cả
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.15rem 0.5rem',
                                borderRadius: '999px',
                                background: 'rgba(59, 130, 246, 0.12)',
                                color: 'var(--info-text)',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Users size={11} /> Chia sẻ: {Array.isArray(tbl.sharedWith) ? tbl.sharedWith.length : 0} người
                            </span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
                        {isAdmin && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Share2 size={13} color="var(--accent)" />}
                              onClick={() => setSharingTable(tbl)}
                              title="Chia sẻ liên kết hoặc sửa tên link bảng"
                            >
                              Chia Sẻ
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 size={13} color="var(--danger)" />}
                              onClick={() => handleDeleteSavedTable(tbl.id, tbl.title)}
                              title="Xóa bảng này"
                            >
                              Xóa
                            </Button>
                          </>
                        )}

                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Download size={13} />}
                          onClick={() => exportToExcel(tbl.rows, tbl.title)}
                        >
                          Xuất Excel
                        </Button>

                        <Link
                          href={`/data-hub/tables/${tbl.slug || tbl.id}`}
                          className="btn btn-primary btn-sm"
                          style={{ gap: '0.35rem' }}
                        >
                          <ExternalLink size={13} />
                          Mở Bảng
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Export Center */}
      {activeTab === 'export_center' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
          {/* Export Customers */}
          <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--accent-light)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Users size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Xuất Danh Sách Khách Hàng (CRM)</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Xuất toàn bộ khách hàng, đại lý, thông tin liên hệ, doanh thu tích lũy và nhân viên phụ trách ra file Excel chuẩn.
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Download size={15} />}
              onClick={() => handleExportEntity('customers')}
            >
              Xuất File Khách Hàng (.xlsx)
            </Button>
          </div>

          {/* Export Inventory */}
          <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--warning-light)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <Package size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Xuất Danh Mục Kho Hàng</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Xuất danh mục sản phẩm, mã SKU, số lượng tồn kho, giá vốn, giá bán niêm yết và tình trạng cảnh báo tồn kho.
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Download size={15} />}
              onClick={() => handleExportEntity('inventory')}
            >
              Xuất File Kho Hàng (.xlsx)
            </Button>
          </div>

          {/* Export Orders */}
          <div className="card card-glass" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--purple-light)', color: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <ShoppingBag size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Xuất Báo Cáo Đơn Hàng & Doanh Số</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                Xuất lịch sử đơn hàng, khách mua, doanh số, trạng thái thanh toán và người lập đơn ra bảng tính Excel.
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Download size={15} />}
              onClick={() => handleExportEntity('orders')}
            >
              Xuất Báo Cáo Đơn Hàng (.xlsx)
            </Button>
          </div>
        </div>
      )}

      {/* Share & Rename Table Modal (Admin Only) */}
      {isAdmin && sharingTable && (
        <ShareTableModal
          isOpen={Boolean(sharingTable)}
          onClose={() => setSharingTable(null)}
          table={sharingTable}
          onSaved={() => {
            loadSavedTables();
            setSharingTable(null);
          }}
        />
      )}
    </div>
  );
}
