const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

function parseUploadedFile(filePath, originalName) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('File rỗng hoặc không có dữ liệu hợp lệ');
  }

  const rawHeaders = Object.keys(rawRows[0]);
  const columns = rawHeaders.map((header) => {
    let detectedType = 'string';
    for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
      const val = rawRows[i][header];
      if (val === undefined || val === '') continue;

      const strVal = String(val).trim();
      if (/^\d{9,11}$/.test(strVal) || /^(\+84|0)[1-9][0-9]{8}$/.test(strVal)) {
        detectedType = 'phone';
        break;
      } else if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        detectedType = 'email';
        break;
      } else if (
        !isNaN(Number(val)) &&
        (header.toLowerCase().includes('giá') ||
          header.toLowerCase().includes('tiền') ||
          header.toLowerCase().includes('ngân sách') ||
          header.toLowerCase().includes('doanh thu'))
      ) {
        detectedType = 'currency';
        break;
      } else if (!isNaN(Number(val))) {
        detectedType = 'number';
        break;
      }
    }

    return {
      key: header,
      label: header,
      type: detectedType
    };
  });

  return {
    fileName: originalName,
    storedFilePath: filePath,
    rowCount: rawRows.length,
    columns,
    headers: rawHeaders,
    rows: rawRows
  };
}

function exportCollectionToBuffer(collectionName) {
  let rawData = [];
  let sheetName = 'Sheet1';

  if (collectionName === 'customers') {
    sheetName = 'Khách Hàng';
    rawData = db.getAll('customers').map((c) => ({
      'Mã KH': c.code,
      'Tên Doanh Nghiệp': c.name,
      'Đại Diện': c.contactPerson || '',
      'Số Điện Thoại': c.phone,
      'Email': c.email || '',
      'Địa Chỉ': c.address || '',
      'Phân Nhóm': c.group || '',
      'Trạng Thái': c.status,
      'Doanh Thu Tích Lũy': Number(c.revenue) || 0,
      'Nhân Viên Phụ Trách': c.assignedStaffName || ''
    }));
  } else if (collectionName === 'products') {
    sheetName = 'Kho Hàng';
    rawData = db.getAll('products').map((p) => ({
      'Mã SKU': p.sku,
      'Tên Sản Phẩm': p.name,
      'Danh Mục': p.category,
      'Đơn Vị Tính': p.unit,
      'Giá Vốn': Number(p.costPrice) || 0,
      'Giá Bán': Number(p.salePrice) || 0,
      'Tồn Kho': p.stock,
      'Tối Thiểu': p.minStock,
      'Tình Trạng': p.status
    }));
  } else if (collectionName === 'orders') {
    sheetName = 'Đơn Hàng';
    rawData = db.getAll('orders').map((o) => ({
      'Mã Đơn': o.orderNumber,
      'Khách Hàng': o.customerName,
      'Số Sản Phẩm': o.items ? o.items.length : 0,
      'Tạm Tính': Number(o.subtotal) || 0,
      'Chiết Khấu': Number(o.discount) || 0,
      'Tổng Tiền': Number(o.totalAmount) || 0,
      'Phương Thức': o.paymentMethod,
      'Trạng Thái': o.status,
      'Thanh Toán': o.paymentStatus,
      'Người Lập': o.createdByName || '',
      'Thời Gian': o.createdAt
    }));
  }

  const worksheet = XLSX.utils.json_to_sheet(rawData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

module.exports = {
  parseUploadedFile,
  exportCollectionToBuffer
};
