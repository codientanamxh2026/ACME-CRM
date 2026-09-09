import * as XLSX from 'xlsx';

/**
 * Export JSON data to styled Excel (.xlsx) file and trigger browser download
 */
export function exportToExcel(data, fileName = 'export-data', sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('Không có dữ liệu để xuất file!');
    return false;
  }

  try {
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Calculate dynamic column widths
    const keys = Object.keys(data[0]);
    const colWidths = keys.map((key) => {
      let maxLen = String(key).length;
      data.forEach((row) => {
        const val = row[key];
        if (val !== undefined && val !== null) {
          const len = String(val).length;
          if (len > maxLen) maxLen = Math.min(len, 50); // Cap at 50 chars
        }
      });
      return { wch: Math.max(maxLen + 3, 12) };
    });

    worksheet['!cols'] = colWidths;

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Write file and trigger download
    const fullFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    XLSX.writeFile(workbook, fullFileName);
    return true;
  } catch (err) {
    console.error('Error exporting to Excel:', err);
    alert('Lỗi khi xuất file Excel: ' + err.message);
    return false;
  }
}

/**
 * Parse an uploaded Excel or CSV file in the browser
 */
export async function parseExcelOrCsv(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });

        // Get first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Parse to JSON array
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          resolve({
            success: false,
            error: 'File rỗng hoặc không chứa dòng dữ liệu hợp lệ.'
          });
          return;
        }

        // Detect columns and types
        const firstRow = rawRows[0];
        const rawHeaders = Object.keys(firstRow);

        const columns = rawHeaders.map((header) => {
          // Detect type by scanning top rows
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

        resolve({
          success: true,
          fileName: file.name,
          fileSize: file.size,
          rowCount: rawRows.length,
          columns,
          headers: rawHeaders,
          rows: rawRows
        });
      } catch (err) {
        console.error('Error parsing file:', err);
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate standard sample template for users to download
 */
export function downloadSampleTemplate(type = 'customers') {
  let sampleData = [];
  let fileName = 'mau-du-lieu.xlsx';

  if (type === 'customers') {
    fileName = 'mau-import-khach-hang.xlsx';
    sampleData = [
      {
        'Mã Khách Hàng': 'KH-001',
        'Tên Doanh Nghiệp': 'Công ty TNHH Hưng Phát',
        'Người Liên Hệ': 'Nguyễn Văn Hưng',
        'Số Điện Thoại': '0912345678',
        'Email': 'hung@hungphat.vn',
        'Địa Chỉ': '123 Cách Mạng Tháng 8, Q.3, TP.HCM',
        'Nhóm Khách Hàng': 'Doanh nghiệp',
        'Trạng Thái': 'Đang tư vấn',
        'Doanh Thu Dự Kiến': 25000000
      },
      {
        'Mã Khách Hàng': 'KH-002',
        'Tên Doanh Nghiệp': 'Cửa hàng Tiện lợi Phúc An',
        'Người Liên Hệ': 'Lê Thị An',
        'Số Điện Thoại': '0987654321',
        'Email': 'an.phuc@gmail.com',
        'Địa Chỉ': '45 Hai Bà Trưng, Hoàn Kiếm, Hà Nội',
        'Nhóm Khách Hàng': 'Đại lý',
        'Trạng Thái': 'Khách hàng thân thiết',
        'Doanh Thu Dự Kiến': 45000000
      }
    ];
  } else if (type === 'products') {
    fileName = 'mau-import-san-pham-kho.xlsx';
    sampleData = [
      {
        'Mã SKU': 'SP-NEW-01',
        'Tên Sản Phẩm': 'Máy in mã vạch để bàn Bixolon',
        'Danh Mục': 'Máy in mã vạch',
        'Đơn Vị Tính': 'Cái',
        'Giá Vốn': 2800000,
        'Giá Bán': 3950000,
        'Tồn Kho Ban Đầu': 15,
        'Tồn Kho Tối Thiểu': 5,
        'Mô Tả': 'Độ phân giải 203dpi, tốc độ in 152mm/s.'
      },
      {
        'Mã SKU': 'SP-NEW-02',
        'Tên Sản Phẩm': 'Cuộn Decal nhiệt 50x30mm (1000 tem)',
        'Danh Mục': 'Vật tư tiêu hao',
        'Đơn Vị Tính': 'Cuộn',
        'Giá Vốn': 45000,
        'Giá Bán': 75000,
        'Tồn Kho Ban Đầu': 120,
        'Tồn Kho Tối Thiểu': 30,
        'Mô Tả': 'Decal cảm nhiệt trực tiếp không cần mực ribbon.'
      }
    ];
  }

  exportToExcel(sampleData, fileName, 'Dữ liệu mẫu');
}
