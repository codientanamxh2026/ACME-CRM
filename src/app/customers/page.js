'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Phone, Mail, UserPlus, Filter } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatVND, CUSTOMER_STATUS_CONFIG } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const { hasRole, user } = useAuth();

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    status: 'lead',
    group: 'Doanh nghiệp',
    revenue: 0,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    let url = '/api/customers';
    if (statusFilter) url += `?status=${statusFilter}`;
    const res = await fetchApi(url);
    if (res.success) {
      setCustomers(res.data);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    let url = '/api/customers';
    if (statusFilter) url += `?status=${statusFilter}`;
    fetchApi(url).then((res) => {
      if (!ignore) {
        if (res.success) setCustomers(res.data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, [statusFilter]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      code: '',
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      status: 'lead',
      group: 'Doanh nghiệp',
      revenue: 0,
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      code: customer.code || '',
      name: customer.name || '',
      contactPerson: customer.contactPerson || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      status: customer.status || 'lead',
      group: customer.group || 'Doanh nghiệp',
      revenue: customer.revenue || 0,
      notes: customer.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Vui lòng nhập tên khách hàng và số điện thoại');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingCustomer) {
        res = await fetchApi(`/api/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetchApi('/api/customers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (res.success) {
        setIsModalOpen(false);
        loadCustomers();
      } else {
        alert(res.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa khách hàng "${name}"?`)) return;

    const res = await fetchApi(`/api/customers/${id}`, { method: 'DELETE' });
    if (res.success) {
      loadCustomers();
    } else {
      alert(res.error || 'Lỗi khi xóa khách hàng');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Mã KH',
      width: '100px',
      render: (val, row) => (
        <div>
          <strong style={{ color: 'var(--accent)' }}>{val}</strong>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.group}</div>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Khách Hàng & Liên Hệ',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          {row.contactPerson && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Đại diện: {row.contactPerson}
            </div>
          )}
          {row.address && (
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {row.address}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Liên Hệ',
      render: (val, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
          <a
            href={`tel:${val}`}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--info-text)', fontWeight: 500 }}
          >
            <Phone size={12} /> {val}
          </a>
          {row.email && (
            <a
              href={`mailto:${row.email}`}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}
            >
              <Mail size={12} /> {row.email}
            </a>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      render: (val) => {
        const conf = CUSTOMER_STATUS_CONFIG[val] || { label: val, badgeClass: 'badge-primary' };
        return <span className={`badge ${conf.badgeClass}`}>{conf.label}</span>;
      }
    },
    {
      key: 'revenue',
      label: 'Doanh Thu',
      align: 'right',
      render: (val) => <span style={{ fontWeight: 600 }}>{formatVND(val)}</span>
    },
    {
      key: 'assignedStaffName',
      label: 'Phụ Trách',
      render: (val) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {val || 'Chưa gán'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Thao Tác',
      align: 'center',
      sortable: false,
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit2 size={13} />}
            onClick={() => handleOpenEdit(row)}
            title="Sửa khách hàng"
          />
          {hasRole(['admin', 'manager']) && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} color="var(--danger)" />}
              onClick={() => handleDelete(row.id, row.name)}
              title="Xóa khách hàng"
            />
          )}
        </div>
      )
    }
  ];

  const statusTabs = [
    { label: 'Tất cả', value: '' },
    { label: 'Khách mới (Lead)', value: 'lead' },
    { label: 'Đã liên hệ', value: 'contacted' },
    { label: 'Đang thương thảo', value: 'negotiating' },
    { label: 'Thân thiết (Won)', value: 'won' },
    { label: 'Ngừng giao dịch', value: 'churned' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top action header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        {/* Status Filter Tabs */}
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
          icon={<UserPlus size={15} />}
          onClick={handleOpenAdd}
        >
          Thêm Khách Hàng
        </Button>
      </div>

      {/* Customer Data Table */}
      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Tìm kiếm tên, mã KH, SĐT, người đại diện..."
        exportFileName="danh-sach-khach-hang-crm"
        emptyMessage="Không tìm thấy khách hàng phù hợp"
        defaultPageSize={10}
      />

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Chỉnh Sửa Thông Tin Khách Hàng' : 'Thêm Mới Khách Hàng (Lead)'}
        subtitle="Cập nhật hồ sơ thông tin liên hệ và trạng thái chăm sóc"
        maxWidth="620px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {editingCustomer ? 'Lưu Thay Đổi' : 'Tạo Khách Hàng'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Tên Doanh Nghiệp / Khách Hàng *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Công ty TNHH Cơ Khí An Phát"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Người Đại Diện Liên Hệ</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Anh Tuấn"
              value={formData.contactPerson}
              onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số Điện Thoại *</label>
            <input
              type="tel"
              className="form-input"
              placeholder="VD: 0987654321"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="VD: contact@anphat.vn"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phân Nhóm Khách Hàng</label>
            <select
              className="form-select"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
            >
              <option value="Doanh nghiệp">Doanh nghiệp</option>
              <option value="Đại lý">Đại lý</option>
              <option value="Khách hàng Lớn">Khách hàng Lớn</option>
              <option value="Cá nhân / Hộ kinh doanh">Cá nhân / Hộ kinh doanh</option>
              <option value="F&B">F&B</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Trạng Thái Tiếp Cận</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="lead">Khách mới (Lead)</option>
              <option value="contacted">Đã liên hệ</option>
              <option value="negotiating">Đang thương thảo</option>
              <option value="won">Khách hàng thân thiết</option>
              <option value="churned">Ngừng giao dịch</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Doanh Thu Tích Lũy (VNĐ)</label>
            <input
              type="number"
              className="form-input"
              placeholder="0"
              value={formData.revenue}
              onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Địa Chỉ</label>
            <input
              type="text"
              className="form-input"
              placeholder="Số nhà, tên đường, quận/huyện, tỉnh/thành"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Ghi Chú & Nhu Cầu</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Thông tin thêm về nhu cầu sản phẩm, lịch sử trao đổi..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
