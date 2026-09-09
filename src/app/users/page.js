'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, UserPlus, Edit2, Trash2, Key, History, AlertCircle, Eye, EyeOff } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { formatDateTime, ROLE_CONFIG } from '@/lib/formatters';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

export default function UsersManagementPage() {
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'logs'
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const { user: currentUser, hasRole } = useAuth();

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    department: 'Phòng Kinh Doanh',
    phone: '',
    status: 'active'
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [usersRes, logsRes] = await Promise.all([
      fetchApi('/api/users'),
      fetchApi('/api/audit-logs')
    ]);

    if (usersRes.success) setUsers(usersRes.data);
    if (logsRes.success) setAuditLogs(logsRes.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    let ignore = false;
    Promise.all([
      fetchApi('/api/users'),
      fetchApi('/api/audit-logs')
    ]).then(([usersRes, logsRes]) => {
      if (!ignore) {
        if (usersRes.success) setUsers(usersRes.data);
        if (logsRes.success) setAuditLogs(logsRes.data);
        setLoading(false);
      }
    });
    return () => {
      ignore = true;
    };
  }, []);

  if (!hasRole(['admin'])) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <AlertCircle size={36} color="var(--danger)" style={{ margin: '0 auto 1rem' }} />
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Khu Vực Hạn Chế Quyền Hạn</h3>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Bạn cần có tài khoản quyền Quản trị viên (Admin) để xem và quản lý nhân sự & phân quyền hệ thống.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      department: 'Phòng Kinh Doanh',
      phone: '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUser(u);
    setFormData({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'staff',
      department: u.department || 'Phòng Kinh Doanh',
      phone: u.phone || '',
      status: u.status || 'active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      alert('Vui lòng điền đầy đủ họ tên, email và mật khẩu');
      return;
    }

    setSubmitting(true);
    try {
      let res;
      if (editingUser) {
        res = await fetchApi(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        res = await fetchApi('/api/users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        alert(res.error || 'Lỗi khi lưu thông tin người dùng');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${name}"?`)) return;

    const res = await fetchApi(`/api/users/${id}`, { method: 'DELETE' });
    if (res.success) {
      loadData();
    } else {
      alert(res.error || 'Lỗi khi xóa người dùng');
    }
  };

  const userColumns = [
    {
      key: 'name',
      label: 'Họ Tên & Email',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      )
    },
    {
      key: 'role',
      label: 'Vai Trò (Phân Quyền)',
      align: 'center',
      render: (val) => {
        const conf = ROLE_CONFIG[val] || { label: val, badgeClass: 'badge-primary' };
        return <span className={`badge ${conf.badgeClass}`}>{conf.label}</span>;
      }
    },
    {
      key: 'department',
      label: 'Phòng Ban / Bộ Phận'
    },
    {
      key: 'phone',
      label: 'Số Điện Thoại'
    },
    {
      key: 'status',
      label: 'Trạng Thái',
      align: 'center',
      render: (val) => (
        <span className={`badge ${val === 'active' ? 'badge-success' : 'badge-danger'}`}>
          {val === 'active' ? 'Hoạt động' : 'Tạm khóa'}
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
            title="Chỉnh sửa tài khoản"
          />
          {row.id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Trash2 size={13} color="var(--danger)" />}
              onClick={() => handleDeleteUser(row.id, row.name)}
              title="Xóa tài khoản"
            />
          )}
        </div>
      )
    }
  ];

  const logColumns = [
    {
      key: 'timestamp',
      label: 'Thời Gian',
      width: '160px',
      render: (val) => (
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          {formatDateTime(val)}
        </span>
      )
    },
    {
      key: 'action',
      label: 'Hành Động',
      render: (val) => <span className="badge badge-purple">{val}</span>
    },
    {
      key: 'description',
      label: 'Nội Dung Chi Tiết'
    },
    {
      key: 'userName',
      label: 'Người Thực Hiện',
      render: (val) => (
        <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>{val}</span>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'var(--bg-surface)',
            padding: '0.4rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)'
          }}
        >
          <button
            onClick={() => setActiveTab('users')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'users' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'users' ? '#fff' : 'var(--text-secondary)',
              gap: '0.4rem'
            }}
          >
            <ShieldCheck size={15} />
            Danh Sách Tài Khoản & Phân Quyền ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className="btn btn-sm"
            style={{
              background: activeTab === 'logs' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'logs' ? '#fff' : 'var(--text-secondary)',
              gap: '0.4rem'
            }}
          >
            <History size={15} />
            Nhật Ký Hoạt Động Hệ Thống ({auditLogs.length})
          </button>
        </div>

        {activeTab === 'users' && (
          <Button
            variant="primary"
            icon={<UserPlus size={15} />}
            onClick={handleOpenAdd}
          >
            Tạo Người Dùng Mới
          </Button>
        )}
      </div>

      {activeTab === 'users' ? (
        <DataTable
          columns={userColumns}
          data={users}
          loading={loading}
          searchPlaceholder="Tìm theo tên, email, vai trò..."
          exportFileName="danh-sach-tai-khoan-he-thong"
          defaultPageSize={10}
        />
      ) : (
        <DataTable
          columns={logColumns}
          data={auditLogs}
          loading={loading}
          searchPlaceholder="Tìm nhật ký..."
          exportFileName="nhat-ky-he-thong-crm"
          defaultPageSize={15}
        />
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUser ? 'Chỉnh Sửa Tài Khoản Nhân Viên' : 'Tạo Tài Khoản Người Dùng Mới'}
        subtitle="Cấu hình quyền truy cập theo mô hình phân quyền RBAC"
        maxWidth="560px"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" loading={submitting} onClick={handleSubmit}>
              {editingUser ? 'Lưu Cấu Hình' : 'Tạo Tài Khoản'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Họ Và Tên *</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Nguyễn Văn A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Đăng Nhập *</label>
            <input
              type="email"
              className="form-input"
              placeholder="name@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={!!editingUser}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {editingUser ? 'Mật Khẩu Mới (Để trống nếu không đổi)' : 'Mật Khẩu Khởi Tạo *'}
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                style={{ paddingRight: '2.5rem', width: '100%' }}
                required={!editingUser}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                style={{
                  position: 'absolute',
                  right: '0.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '2rem',
                  height: '2rem',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  borderRadius: '6px',
                  zIndex: 3
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Vai Trò Phân Quyền (Role) *</label>
            <select
              className="form-select"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            >
              <option value="admin">👑 Admin (Quản trị toàn quyền)</option>
              <option value="manager">💼 Trưởng phòng Kinh Doanh</option>
              <option value="staff">🎯 Nhân viên Kinh Doanh</option>
              <option value="inventory">📦 Quản lý Kho Hàng</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Bộ Phận / Phòng Ban</label>
            <input
              type="text"
              className="form-input"
              placeholder="VD: Phòng Kinh Doanh"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Số Điện Thoại</label>
            <input
              type="tel"
              className="form-input"
              placeholder="0912345678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Trạng Thái Hoạt Động</label>
            <select
              className="form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="active">Hoạt động bình thường</option>
              <option value="inactive">Tạm khóa tài khoản</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
