// Formatting utilities for Acme CRM (Vietnamese Locale)

export function formatVND(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(num) {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('vi-VN').format(num);
}

export function formatDateTime(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDate(isoString) {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(d);
  } catch {
    return isoString;
  }
}

export const ROLE_CONFIG = {
  admin: { label: 'Quản trị viên', badgeClass: 'badge-purple' },
  manager: { label: 'Trưởng phòng KD', badgeClass: 'badge-primary' },
  staff: { label: 'Nhân viên kinh doanh', badgeClass: 'badge-info' },
  inventory: { label: 'Quản lý kho', badgeClass: 'badge-warning' }
};

export const ORDER_STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', badgeClass: 'badge-warning' },
  confirmed: { label: 'Đã xác nhận', badgeClass: 'badge-info' },
  shipping: { label: 'Đang giao hàng', badgeClass: 'badge-purple' },
  completed: { label: 'Hoàn thành', badgeClass: 'badge-success' },
  cancelled: { label: 'Đã hủy', badgeClass: 'badge-danger' }
};

export const CUSTOMER_STATUS_CONFIG = {
  lead: { label: 'Khách mới (Lead)', badgeClass: 'badge-info' },
  contacted: { label: 'Đã liên hệ', badgeClass: 'badge-purple' },
  negotiating: { label: 'Đang thương thảo', badgeClass: 'badge-warning' },
  won: { label: 'Khách hàng thân thiết', badgeClass: 'badge-success' },
  churned: { label: 'Ngừng giao dịch', badgeClass: 'badge-danger' }
};

export const STOCK_STATUS_CONFIG = {
  in_stock: { label: 'Tồn kho tốt', badgeClass: 'badge-success' },
  low_stock: { label: 'Cảnh báo sắp hết', badgeClass: 'badge-warning' },
  out_of_stock: { label: 'Hết hàng', badgeClass: 'badge-danger' }
};
