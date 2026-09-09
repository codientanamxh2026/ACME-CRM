'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingBag, Plus, Eye, Trash2, CheckCircle2, XCircle, ArrowRight, Truck } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatVND, formatDateTime, ORDER_STATUS_CONFIG } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { hasRole, user } = useAuth();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // New Order Form state
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    items: [],
    discount: 0,
    paymentMethod: 'bank_transfer',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    let url = '/api/orders';
    if (statusFilter) url += `?status=${statusFilter}`;

    const [ordersRes, custRes, prodRes] = await Promise.all([
      fetchApi(url),
      fetchApi('/api/customers'),
      fetchApi('/api/products')
    ]);

    if (ordersRes.success) setOrders(ordersRes.data);
    if (custRes.success) setCustomers(custRes.data);
    if (prodRes.success) setProducts(prodRes.data);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    let url = '/api/orders';
    if (statusFilter) url += `?status=${statusFilter}`;

    Promise.all([
      fetchApi(url),
      fetchApi('/api/customers'),
      fetchApi('/api/products')
    ]).then(([ordersRes, custRes, prodRes]) => {
      if (!ignore) {
        if (ordersRes.success) setOrders(ordersRes.data);
        if (custRes.success) setCustomers(custRes.data);
        if (prodRes.success) setProducts(prodRes.data);
        setLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  const handleOpenCreate = () => {
    setNewOrder({
      customerId: customers[0]?.id || '',
      items: [
        {
          productId: products[0]?.id || '',
          quantity: 1,
          price: products[0]?.salePrice || 0
        }
      ],
      discount: 0,
      paymentMethod: 'bank_transfer',
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleAddItem = () => {
    if (products.length === 0) return;
    setNewOrder({
      ...newOrder,
      items: [
        ...newOrder.items,
        {
          productId: products[0].id,
          quantity: 1,
          price: products[0].salePrice
        }
      ]
    });
  };

  const handleRemoveItem = (index) => {
    const updated = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({ ...newOrder, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...newOrder.items];
    if (field === 'productId') {
      const selectedProd = products.find((p) => p.id === value);
      updated[index] = {
        ...updated[index],
        productId: value,
        price: selectedProd ? selectedProd.salePrice : 0
      };
    } else {
      updated[index][field] = Number(value);
    }
    setNewOrder({ ...newOrder, items: updated });
  };

  // Calculate totals
  const subtotal = newOrder.items.reduce((sum, item) => {
    return sum + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);
  const totalAmount = Math.max(0, subtotal - (Number(newOrder.discount) || 0));

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newOrder.customerId) {
      alert('Vui lòng chọn khách hàng mua');
      return;
    }
    if (newOrder.items.length === 0) {
      alert('Vui lòng thêm ít nhất một sản phẩm');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchApi('/api/orders', {
        method: 'POST',
        body: JSON.stringify(newOrder)
      });

      if (res.success) {
        setIsCreateModalOpen(false);
        loadData();
      } else {
        alert(res.error || 'Lỗi khi tạo đơn hàng');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const res = await fetchApi(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });

    if (res.success) {
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(res.data);
      }
      loadData();
    } else {
      alert(res.error || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDeleteOrder = async (id, orderNumber) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn hàng ${orderNumber}?`)) return;

    const res = await fetchApi(`/api/orders/${id}`, { method: 'DELETE' });
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Lỗi khi xóa đơn hàng');
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      label: 'Mã Đơn',
      width: '130px',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--accent)' }}>{val}</strong>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {formatDateTime(row.createdAt)}
          </div>
        </div>
      )
    },
    {
      key: 'customerName',
      label: 'Khách Hàng',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {row.items?.length || 0} sản phẩm • Tạo bởi: {row.createdByName}
          </div>
        </div>
      )
    },
    {
      key: 'totalAmount',
      label: 'Tổng Tiền',
      align: 'right',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatVND(val)}</div>
          {row.discount > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--danger-text)' }}>
              - Giảm {formatVND(row.discount)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'paymentStatus',
      label: 'Thanh Toán',
      align: 'center',
      render: (val) => {
        const isPaid = val === 'paid';
        return (
          <span className={`badge ${isPaid ? 'badge-success' : 'badge-warning'}`}>
            {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Trạng Thái Đơn',
      align: 'center',
      render: (val) => {
        const conf = ORDER_STATUS_CONFIG[val] || { label: val, badgeClass: 'badge-primary' };
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
          <Button
            variant="secondary"
            size="sm"
            icon={<Eye size={13} />}
            onClick={() => {
              setSelectedOrder(row);
              setIsDetailModalOpen(true);
            }}
            title="Xem chi tiết đơn"
          >
            Chi tiết
          </Button>

          {hasRole(['admin']) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} color="var(--danger)" />}
              onClick={() => handleDeleteOrder(row.id, row.orderNumber)}
              title="Xóa đơn hàng"
            />
          )}
        </div>
      )
    }
  ];

  const statusTabs = [
    { label: 'Tất cả', value: '' },
    { label: 'Chờ duyệt', value: 'pending' },
    { label: 'Đã xác nhận', value: 'confirmed' },
    { label: 'Đang giao', value: 'shipping' },
    { label: 'Hoàn thành', value: 'completed' },
    { label: 'Đã hủy', value: 'cancelled' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Action Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-elevated)',
            padding: '0.3rem',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto'
          }}
        >
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              style={{
                padding: '0.4rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 500,
                borderRadius: 'var(--radius-sm)',
                background: statusFilter === tab.value ? 'var(--bg-surface)' : 'transparent',
                color: statusFilter === tab.value ? 'var(--accent-text)' : 'var(--text-secondary)',
                boxShadow: statusFilter === tab.value ? 'var(--shadow-sm)' : 'none',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button
          variant="primary"
          icon={<Plus size={15} />}
          onClick={handleOpenCreate}
        >
          Tạo Đơn Hàng Mới
        </Button>
      </div>

      {/* Orders Table */}
      <DataTable
        columns={columns}
        data={orders}
        loading={loading}
        searchPlaceholder="Tìm theo mã đơn, khách hàng, người tạo..."
        exportFileName="danh-sach-don-hang-crm"
        emptyMessage="Chưa có đơn hàng nào trong mục này"
        defaultPageSize={10}
      />

      {/* Create Order Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lập Đơn Bán Hàng Mới"
        subtitle="Chọn khách hàng và sản phẩm (Tự động trừ số lượng tồn kho)"
        maxWidth="740px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleCreateSubmit}>
              Xác Nhận & Tạo Đơn
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Khách Hàng Mua Hàng *</label>
              <select
                className="form-select"
                value={newOrder.customerId}
                onChange={(e) => setNewOrder({ ...newOrder, customerId: e.target.value })}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code}) - {c.phone}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phương Thức Thanh Toán</label>
              <select
                className="form-select"
                value={newOrder.paymentMethod}
                onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
              >
                <option value="bank_transfer">Chuyển khoản Ngân hàng</option>
                <option value="cod">Thu hộ tiền mặt khi giao (COD)</option>
                <option value="cash">Tiền mặt tại quầy</option>
              </select>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Danh Sách Sản Phẩm Đặt Mua *
              </label>
              <Button variant="secondary" size="sm" icon={<Plus size={13} />} onClick={handleAddItem}>
                Thêm Dòng
              </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {newOrder.items.map((item, idx) => {
                const prod = products.find((p) => p.id === item.productId);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '3fr 1fr 1.5fr auto',
                      gap: '0.5rem',
                      alignItems: 'center',
                      background: 'var(--bg-elevated)',
                      padding: '0.6rem 0.75rem',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <select
                      className="form-select"
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Tồn: {p.stock} {p.unit}) - {formatVND(p.salePrice)}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      className="form-input"
                      placeholder="SL"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                    />

                    <div style={{ textAlign: 'right', fontWeight: 600, fontSize: '0.9rem' }}>
                      {formatVND((Number(item.price) || 0) * (Number(item.quantity) || 0))}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={newOrder.items.length === 1}
                      className="btn-icon"
                      style={{ width: '28px', height: '28px', color: 'var(--danger)' }}
                      title="Xóa dòng"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing summary */}
          <div
            style={{
              padding: '1rem',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
              <span>Tổng tiền hàng:</span>
              <strong>{formatVND(subtotal)}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem' }}>Chiết khấu giảm giá (VNĐ):</span>
              <input
                type="number"
                className="form-input"
                style={{ width: '160px', textAlign: 'right' }}
                value={newOrder.discount}
                onChange={(e) => setNewOrder({ ...newOrder, discount: Number(e.target.value) })}
                min="0"
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '0.5rem',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--accent)'
              }}
            >
              <span>Thành tiền thanh toán:</span>
              <span>{formatVND(totalAmount)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi Chú Giao Hàng</label>
            <textarea
              className="form-textarea"
              rows={2}
              placeholder="Yêu cầu đóng gói, giao giờ hành chính..."
              value={newOrder.notes}
              onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Order Detail & Status Transition Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Chi Tiết Đơn Hàng ${selectedOrder.orderNumber}`}
          subtitle={`Khách hàng: ${selectedOrder.customerName} • Ngày lập: ${formatDateTime(selectedOrder.createdAt)}`}
          maxWidth="680px"
          footer={
            <Button variant="secondary" onClick={() => setIsDetailModalOpen(false)}>
              Đóng
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Status changer toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Trạng thái:</span>
                <span
                  className={`badge ${(ORDER_STATUS_CONFIG[selectedOrder.status] || {}).badgeClass}`}
                >
                  {(ORDER_STATUS_CONFIG[selectedOrder.status] || {}).label}
                </span>
              </div>

              {/* Status workflow transitions */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {selectedOrder.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<CheckCircle2 size={14} />}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}
                  >
                    Duyệt đơn
                  </Button>
                )}

                {selectedOrder.status === 'confirmed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Truck size={14} />}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'shipping')}
                  >
                    Xuất kho & Giao
                  </Button>
                )}

                {selectedOrder.status === 'shipping' && (
                  <Button
                    variant="success"
                    size="sm"
                    icon={<CheckCircle2 size={14} />}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}
                  >
                    Hoàn thành
                  </Button>
                )}

                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'completed' && (
                  <Button
                    variant="danger"
                    size="sm"
                    icon={<XCircle size={14} />}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                  >
                    Hủy đơn
                  </Button>
                )}
              </div>
            </div>

            {/* Line Items List */}
            <div>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, marginBottom: '0.6rem' }}>
                Sản phẩm trong đơn:
              </h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sản Phẩm</th>
                      <th style={{ textAlign: 'center' }}>Số Lượng</th>
                      <th style={{ textAlign: 'right' }}>Đơn Giá</th>
                      <th style={{ textAlign: 'right' }}>Thành Tiền</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <strong>{item.name}</strong>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.sku}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>{formatVND(item.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatVND(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tạm tính:</span>
                  <span>{formatVND(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger-text)' }}>
                    <span>Chiết khấu:</span>
                    <span>-{formatVND(selectedOrder.discount)}</span>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '0.4rem',
                    borderTop: '1px solid var(--border-subtle)',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    color: 'var(--accent)'
                  }}
                >
                  <span>Tổng thanh toán:</span>
                  <span>{formatVND(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
                <strong>Ghi chú:</strong> {selectedOrder.notes}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
