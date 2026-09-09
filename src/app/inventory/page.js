'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, PackagePlus, ArrowUpRight, ArrowDownRight, Edit2, Trash2, AlertTriangle } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatVND, formatNumber, STOCK_STATUS_CONFIG } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const { hasRole } = useAuth();

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Thiết bị POS',
    unit: 'Cái',
    costPrice: 0,
    salePrice: 0,
    stock: 0,
    minStock: 5,
    description: ''
  });

  const [adjustData, setAdjustData] = useState({
    type: 'in', // 'in' or 'out'
    quantity: 1,
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    let url = '/api/products';
    if (lowStockFilter) url += '?low_stock=true';
    const res = await fetchApi(url);
    if (res.success) {
      setProducts(res.data);
    }
    setLoading(false);
  }, [lowStockFilter]);

  useEffect(() => {
    let ignore = false;
    let url = '/api/products';
    if (lowStockFilter) url += '?low_stock=true';
    fetchApi(url).then((res) => {
      if (!ignore) {
        if (res.success) setProducts(res.data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [lowStockFilter]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: 'Thiết bị POS',
      unit: 'Cái',
      costPrice: 0,
      salePrice: 0,
      stock: 0,
      minStock: 5,
      description: ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      sku: prod.sku || '',
      name: prod.name || '',
      category: prod.category || 'Thiết bị POS',
      unit: prod.unit || 'Cái',
      costPrice: prod.costPrice || 0,
      salePrice: prod.salePrice || 0,
      stock: prod.stock || 0,
      minStock: prod.minStock || 5,
      description: prod.description || ''
    });
    setIsAddModalOpen(true);
  };

  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setAdjustData({
      type: 'in',
      quantity: 1,
      note: ''
    });
    setIsAdjustModalOpen(true);
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      alert('Vui lòng nhập tên sản phẩm và mã SKU');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingProduct) {
        res = await fetchApi(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetchApi('/api/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (res.success) {
        setIsAddModalOpen(false);
        loadProducts();
      } else {
        alert(res.error || 'Lỗi khi lưu sản phẩm');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveStockAdjust = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const delta = adjustData.type === 'in' ? Math.abs(adjustData.quantity) : -Math.abs(adjustData.quantity);

    setSubmitting(true);
    try {
      const res = await fetchApi(`/api/products/${selectedProduct.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          stockDelta: delta,
          note: adjustData.note
        })
      });

      if (res.success) {
        setIsAdjustModalOpen(false);
        loadProducts();
      } else {
        alert(res.error || 'Lỗi điều chỉnh kho');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi kho?`)) return;

    const res = await fetchApi(`/api/products/${id}`, { method: 'DELETE' });
    if (res.success) {
      loadProducts();
    } else {
      alert(res.error || 'Lỗi khi xóa sản phẩm');
    }
  };

  const columns = [
    {
      key: 'sku',
      label: 'Mã SKU',
      width: '120px',
      render: (val) => <strong style={{ color: 'var(--accent)' }}>{val}</strong>
    },
    {
      key: 'name',
      label: 'Sản Phẩm & Phân Loại',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Danh mục: <strong style={{ color: 'var(--text-secondary)' }}>{row.category}</strong> • ĐVT: {row.unit}
          </div>
        </div>
      )
    },
    {
      key: 'costPrice',
      label: 'Giá Vốn',
      align: 'right',
      render: (val) => <span style={{ color: 'var(--text-secondary)' }}>{formatVND(val)}</span>
    },
    {
      key: 'salePrice',
      label: 'Giá Bán Niêm Yết',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatVND(val)}</span>
    },
    {
      key: 'stock',
      label: 'Số Lượng Tồn',
      align: 'center',
      render: (val, row) => {
        const isLow = val <= (row.minStock || 5);
        return (
          <div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: isLow ? 'var(--danger)' : 'var(--success)'
              }}
            >
              {formatNumber(val)} {row.unit}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Tối thiểu: {row.minStock || 5}
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Tình Trạng Kho',
      align: 'center',
      render: (val, row) => {
        const conf = STOCK_STATUS_CONFIG[val] || { label: val, badgeClass: 'badge-primary' };
        return <span className={`badge ${conf.badgeClass}`}>{conf.label}</span>;
      }
    },
    {
      key: 'actions',
      label: 'Thao Tác',
      align: 'center',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          {hasRole(['admin', 'inventory']) && (
            <Button
              variant="secondary"
              size="sm"
              icon={<PackagePlus size={13} />}
              onClick={() => handleOpenAdjust(row)}
              title="Nhập / Xuất kho nhanh"
            >
              Nhập/Xuất
            </Button>
          )}

          {hasRole(['admin', 'inventory']) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Edit2 size={13} />}
              onClick={() => handleOpenEdit(row)}
              title="Chỉnh sửa sản phẩm"
            />
          )}

          {hasRole(['admin']) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} color="var(--danger)" />}
              onClick={() => handleDelete(row.id, row.name)}
              title="Xóa sản phẩm"
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Filter & Actions Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={() => setLowStockFilter(false)}
            className="btn btn-sm"
            style={{
              background: !lowStockFilter ? 'var(--accent-light)' : 'var(--bg-elevated)',
              color: !lowStockFilter ? 'var(--accent-text)' : 'var(--text-secondary)',
              fontWeight: !lowStockFilter ? 600 : 500
            }}
          >
            Tất Cả Sản Phẩm ({products.length})
          </button>

          <button
            onClick={() => setLowStockFilter(true)}
            className="btn btn-sm"
            style={{
              background: lowStockFilter ? 'var(--danger-light)' : 'var(--bg-elevated)',
              color: lowStockFilter ? 'var(--danger-text)' : 'var(--text-secondary)',
              fontWeight: lowStockFilter ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <AlertTriangle size={13} />
            Cảnh Báo Sắp Hết Kho
          </button>
        </div>

        {hasRole(['admin', 'inventory']) && (
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={handleOpenAdd}
          >
            Thêm Sản Phẩm Mới
          </Button>
        )}
      </div>

      {/* Inventory Table */}
      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Tìm kiếm mã SKU, tên sản phẩm, danh mục..."
        exportFileName="danh-muc-kho-hang-crm"
        emptyMessage="Không tìm thấy mặt hàng nào trong kho"
        defaultPageSize={10}
      />

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={editingProduct ? 'Chỉnh Sửa Mặt Hàng' : 'Thêm Sản Phẩm Mới Vào Kho'}
        subtitle="Quản lý thông tin định danh, giá vốn và ngưỡng cảnh báo"
        maxWidth="620px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmitProduct}>
              {editingProduct ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitProduct} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Mã SKU / Định danh *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: SP-POS-01"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              disabled={!!editingProduct}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phân Loại / Danh Mục</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Thiết bị POS, Máy in, Phụ kiện"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Tên Sản Phẩm *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Máy bán hàng POS Cảm ứng Sunmi D2s"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Đơn Vị Tính</label>
            <input
              type="text"
              className="form-input"
              placeholder="Cái, Bộ, Thùng, Hộp"
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số Lượng Ban Đầu</label>
            <input
              type="number"
              className="form-input"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              min="0"
              disabled={!!editingProduct}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Giá Vốn Nhập Kho (VNĐ)</label>
            <input
              type="number"
              className="form-input"
              value={formData.costPrice}
              onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Giá Bán Niêm Yết (VNĐ)</label>
            <input
              type="number"
              className="form-input"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
              min="0"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ngưỡng Tồn Tối Thiểu (Cảnh báo)</label>
            <input
              type="number"
              className="form-input"
              value={formData.minStock}
              onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
              min="1"
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Mô Tả Sản Phẩm</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Thông số kỹ thuật hoặc ghi chú bảo hành..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Quick Stock Adjustment Modal (Nhập / Xuất kho) */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Điều Chỉnh Số Lượng Kho (Nhập / Xuất)"
        subtitle={`Sản phẩm: ${selectedProduct?.name} (${selectedProduct?.sku})`}
        maxWidth="460px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAdjustModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSaveStockAdjust}>
              Lưu Phiếu Kho
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveStockAdjust}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tồn hiện tại trong kho:</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {selectedProduct?.stock} {selectedProduct?.unit}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Loại Thao Tác</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setAdjustData({ ...adjustData, type: 'in' })}
                className="btn btn-sm"
                style={{
                  background: adjustData.type === 'in' ? 'var(--success-light)' : 'var(--bg-elevated)',
                  color: adjustData.type === 'in' ? 'var(--success-text)' : 'var(--text-secondary)',
                  border: adjustData.type === 'in' ? '1px solid var(--success)' : '1px solid var(--border-subtle)'
                }}
              >
                <ArrowDownRight size={15} /> Nhập Thêm Kho (+)
              </button>

              <button
                type="button"
                onClick={() => setAdjustData({ ...adjustData, type: 'out' })}
                className="btn btn-sm"
                style={{
                  background: adjustData.type === 'out' ? 'var(--danger-light)' : 'var(--bg-elevated)',
                  color: adjustData.type === 'out' ? 'var(--danger-text)' : 'var(--text-secondary)',
                  border: adjustData.type === 'out' ? '1px solid var(--danger)' : '1px solid var(--border-subtle)'
                }}
              >
                <ArrowUpRight size={15} /> Xuất Hàng Kho (-)
              </button>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Số Lượng Điều Chỉnh ({selectedProduct?.unit})</label>
            <input
              type="number"
              className="form-input"
              value={adjustData.quantity}
              onChange={(e) => setAdjustData({ ...adjustData, quantity: Math.max(1, Number(e.target.value)) })}
              min="1"
              required
            />
          </div>

          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Lý Do / Ghi Chú Phiếu Kho</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Nhập thêm hàng từ nhà máy, Xuất mẫu thử demo..."
              value={adjustData.note}
              onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
