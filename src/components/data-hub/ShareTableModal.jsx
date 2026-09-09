'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Globe,
  Copy,
  Check,
  Search,
  Edit3,
  Lock,
  UserCheck,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { fetchApi } from '@/lib/api';
import { ROLE_CONFIG } from '@/lib/formatters';

function ShareModalContent({
  isOpen,
  onClose,
  table,
  onSaved
}) {
  const isInitiallyAll = useMemo(() => {
    const currentShared = table?.sharedWith;
    return !currentShared || currentShared === 'all' || (Array.isArray(currentShared) && currentShared.includes('all'));
  }, [table]);

  const [tableTitle, setTableTitle] = useState(table?.title || '');
  const [tableSlug, setTableSlug] = useState(table?.slug || table?.id || '');
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [shareMode, setShareMode] = useState(isInitiallyAll ? 'all' : 'custom');
  const [selectedUserIds, setSelectedUserIds] = useState(
    isInitiallyAll ? [] : (Array.isArray(table?.sharedWith) ? table.sharedWith : [])
  );
  const [copiedLink, setCopiedLink] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load non-admin users once when opened
  useEffect(() => {
    let ignore = false;

    fetchApi('/api/users?all=true')
      .then((res) => {
        if (!ignore && res.success && Array.isArray(res.data)) {
          // Filter OUT Admin users as requested by user: "danh sách người dùng (trừ Admin)"
          const nonAdmins = res.data.filter((u) => u.role !== 'admin');
          setUsers(nonAdmins);

          if (isInitiallyAll) {
            setSelectedUserIds(nonAdmins.map((u) => u.id));
          }
        }
      })
      .catch((err) => {
        console.error('Error loading users for share modal:', err);
      })
      .finally(() => {
        if (!ignore) setLoadingUsers(false);
      });

    return () => {
      ignore = true;
    };
  }, [isInitiallyAll]);

  // Full shareable URL
  const tableUrl = useMemo(() => {
    if (typeof window === 'undefined' || !table?.id) return '';
    const cleanSlug = (tableSlug || table.slug || table.id).trim();
    return `${window.location.origin}/data-hub/tables/${cleanSlug}`;
  }, [table, tableSlug]);

  // Filtered users for search input
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm.trim()) return users;
    const term = userSearchTerm.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.department?.toLowerCase().includes(term)
    );
  }, [users, userSearchTerm]);

  // Check if ALL non-admin users are currently selected
  const isAllChecked = useMemo(() => {
    if (users.length === 0) return false;
    return users.every((u) => selectedUserIds.includes(u.id));
  }, [users, selectedUserIds]);

  // Handle Select All Checkbox
  const handleToggleSelectAll = (e) => {
    const checked = e.target.checked;
    if (checked) {
      setSelectedUserIds(users.map((u) => u.id));
      setShareMode('all');
    } else {
      setSelectedUserIds([]);
      setShareMode('custom');
    }
  };

  // Handle Individual User Checkbox Toggle
  const handleToggleUser = (userId) => {
    setSelectedUserIds((prev) => {
      let updated;
      if (prev.includes(userId)) {
        updated = prev.filter((id) => id !== userId);
      } else {
        updated = [...prev, userId];
      }

      if (users.length > 0 && updated.length === users.length) {
        setShareMode('all');
      } else {
        setShareMode('custom');
      }
      return updated;
    });
  };

  // Switch to Share Mode All
  const handleSelectModeAll = () => {
    setShareMode('all');
    setSelectedUserIds(users.map((u) => u.id));
  };

  // Switch to Share Mode Custom
  const handleSelectModeCustom = () => {
    setShareMode('custom');
  };

  // Copy Link to clipboard
  const handleCopyLink = async () => {
    try {
      if (navigator?.clipboard) {
        await navigator.clipboard.writeText(tableUrl);
      } else {
        const input = document.createElement('input');
        input.value = tableUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      alert('Không thể sao chép liên kết: ' + err.message);
    }
  };

  // Save changes to API
  const handleSaveShare = async () => {
    if (!tableTitle.trim()) {
      alert('Vui lòng nhập tên cho bảng / menu hiển thị');
      return;
    }

    setSaving(true);
    try {
      let finalSharedWith;
      if (shareMode === 'all' || isAllChecked) {
        finalSharedWith = ['all'];
      } else {
        finalSharedWith = selectedUserIds;
      }

      // Safe clean slug
      const cleanedSlug =
        (tableSlug || '')
          .trim()
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-_]/g, '-')
          .replace(/^-+|-+$/g, '') || table.id;

      const res = await fetchApi(`/api/import-export/dynamic-tables/${table.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: tableTitle.trim(),
          slug: cleanedSlug,
          sharedWith: finalSharedWith
        })
      });

      if (res.success) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm:tables-changed', { detail: res.data }));
        }

        if (onSaved) onSaved(res.data);
        onClose();
      } else {
        alert(res.error || 'Lỗi khi cập nhật bảng');
      }
    } catch (err) {
      alert('Lỗi: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chia Sẻ & Sửa Tên Menu / Đường Dẫn Link"
      subtitle={`Tùy chỉnh tên hiển thị trên thanh Menu, địa chỉ link truy cập và danh sách nhân sự được mở bảng "${table?.title}".`}
      maxWidth="680px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Hủy
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSaveShare}>
            Lưu Thay Đổi
          </Button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* 1. Sửa Tên Bảng & Tên Menu */}
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Edit3 size={14} color="var(--accent)" />
            Tên Bảng Dữ Liệu / Tên Hiển Thị Trên Menu <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            value={tableTitle}
            onChange={(e) => setTableTitle(e.target.value)}
            placeholder="Nhập tên hiển thị trên Menu và tiêu đề bảng..."
            style={{ fontWeight: 600, fontSize: '0.95rem' }}
          />
        </div>

        {/* 2. Sửa Đường Dẫn Link (URL Slug) */}
        <div>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <LinkIcon size={14} color="var(--accent)" />
              Tùy Chỉnh Tên Link / Đường Dẫn (Slug)
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Đường dẫn truy cập thân thiện
            </span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRight: 'none',
                padding: '0.5rem 0.65rem',
                borderTopLeftRadius: 'var(--radius-md)',
                borderBottomLeftRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap'
              }}
            >
              /data-hub/tables/
            </span>
            <input
              type="text"
              className="form-input"
              value={tableSlug}
              onChange={(e) => setTableSlug(e.target.value)}
              placeholder="nhap-duong-dan-link..."
              style={{
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                fontFamily: 'monospace',
                fontSize: '0.82rem'
              }}
            />
          </div>
        </div>

        {/* 3. Hộp Xem & Sao Chép Đường Link Trực Tiếp */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
              Đường Dẫn Liên Kết Đầy Đủ
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lock size={12} />
              Chỉ những người được chọn mới có thể mở
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="text"
              readOnly
              value={tableUrl}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                background: 'var(--bg-card)',
                color: 'var(--text-secondary)'
              }}
            />
            <Button
              variant={copiedLink ? 'primary' : 'secondary'}
              size="sm"
              icon={copiedLink ? <Check size={14} /> : <Copy size={14} />}
              onClick={handleCopyLink}
              style={{ whiteSpace: 'nowrap' }}
            >
              {copiedLink ? 'Đã Chép Link!' : 'Sao Chép'}
            </Button>
          </div>
        </div>

        {/* 4. Tùy Chọn Chế Độ Chia Sẻ */}
        <div>
          <label className="form-label" style={{ marginBottom: '0.65rem' }}>
            Phạm Vi Chia Sẻ
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div
              onClick={handleSelectModeAll}
              style={{
                border: shareMode === 'all' ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                background: shareMode === 'all' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <Globe size={18} color="var(--accent)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Tất Cả Mọi Người
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                  Toàn bộ nhân sự trong CRM đều xem được bảng này.
                </div>
              </div>
            </div>

            <div
              onClick={handleSelectModeCustom}
              style={{
                border: shareMode === 'custom' ? '2px solid var(--accent)' : '1px solid var(--border-subtle)',
                background: shareMode === 'custom' ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem'
              }}
            >
              <Users size={18} color="var(--info-text)" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Theo Danh Sách Chọn
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                  Chỉ những người được tích chọn bên dưới mới xem được.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Danh Sách Người Dùng (Trừ Admin) */}
        <div
          style={{
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-card)',
            padding: '0.85rem'
          }}
        >
          {/* Top Bar of User List: Master Checkbox & Search */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-subtle)'
            }}
          >
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                userSelect: 'none',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: 'var(--text-primary)'
              }}
            >
              <input
                type="checkbox"
                checked={isAllChecked}
                onChange={handleToggleSelectAll}
                style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
              />
              <span>Chọn Tất Cả Người Dùng ({users.length})</span>
            </label>

            <div style={{ position: 'relative', width: '220px' }}>
              <Search
                size={14}
                style={{
                  position: 'absolute',
                  left: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                style={{
                  fontSize: '0.78rem',
                  padding: '0.3rem 0.5rem 0.3rem 1.75rem',
                  height: '28px',
                  width: '100%',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)'
                }}
              />
            </div>
          </div>

          {/* User Rows */}
          <div
            style={{
              maxHeight: '220px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              marginTop: '0.65rem'
            }}
          >
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Loader2 size={16} className="spinner-icon" style={{ display: 'inline', marginRight: '6px' }} />
                Đang tải danh sách người dùng...
              </div>
            ) : users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Không có người dùng nào khác ngoài Quản trị viên trong hệ thống.
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Không tìm thấy nhân viên nào khớp với từ khóa.
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isChecked = selectedUserIds.includes(u.id);
                const role = ROLE_CONFIG[u.role] || { label: u.role };

                return (
                  <div
                    key={u.id}
                    onClick={() => handleToggleUser(u.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: isChecked ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                      border: isChecked ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled by row click
                        style={{ width: '16px', height: '16px', accentColor: 'var(--accent)', cursor: 'pointer' }}
                      />
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'var(--accent-light)',
                          color: 'var(--accent)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.75rem'
                        }}
                      >
                        {u.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {u.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {u.email} • {u.department || 'CRM'}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: 'var(--bg-elevated)',
                        color: 'var(--text-secondary)',
                        fontWeight: 500
                      }}
                    >
                      {role.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Stats Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.65rem',
              paddingTop: '0.5rem',
              borderTop: '1px solid var(--border-subtle)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}
          >
            <span>
              Trạng thái: <strong>{shareMode === 'all' || isAllChecked ? 'Chia sẻ Tất Cả' : `Đã chọn ${selectedUserIds.length}/${users.length} người`}</strong>
            </span>
            <span style={{ color: 'var(--text-secondary)' }}>
              * Quản trị viên (Admin) mặc định luôn có toàn quyền quản trị bảng
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ShareTableModal({
  isOpen,
  onClose,
  table,
  onSaved
}) {
  if (!isOpen || !table) return null;

  return (
    <ShareModalContent
      key={`${table.id}-${table.title}-${table.slug || ''}-${Array.isArray(table.sharedWith) ? table.sharedWith.join(',') : table.sharedWith || ''}`}
      isOpen={isOpen}
      onClose={onClose}
      table={table}
      onSaved={onSaved}
    />
  );
}
