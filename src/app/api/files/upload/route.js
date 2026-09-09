import { NextResponse } from 'next/server';
import { requireRole } from '@/server/auth/guard';
import * as XLSX from 'xlsx';

export async function POST(request) {
  const { errorResponse } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tệp tải lên' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return NextResponse.json({ success: false, error: 'Tệp không có trang tính nào' }, { status: 400 });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { defval: '', header: 1 });

    if (!rawData || rawData.length === 0) {
      return NextResponse.json({ success: false, error: 'Trang tính không có dữ liệu' }, { status: 400 });
    }

    const headers = rawData[0].map((h, i) => (h ? String(h).trim() : `Cột ${i + 1}`));
    const rows = [];

    for (let r = 1; r < rawData.length; r++) {
      const rowArr = rawData[r];
      if (!rowArr || rowArr.every((cell) => cell === '' || cell === null || cell === undefined)) {
        continue;
      }

      const rowObj = { id: `row-${r}-${Date.now()}` };
      headers.forEach((hdr, colIndex) => {
        const val = rowArr[colIndex] !== undefined ? rowArr[colIndex] : '';
        rowObj[`col_${colIndex}`] = val;
      });
      rows.push(rowObj);
    }

    const columns = headers.map((hdr, colIndex) => ({
      key: `col_${colIndex}`,
      label: hdr,
      type: 'text'
    }));

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        rowCount: rows.length,
        columns,
        rows
      }
    });
  } catch (err) {
    console.error('File upload route error:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi đọc tệp: ' + err.message }, { status: 500 });
  }
}
