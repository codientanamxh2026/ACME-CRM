import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getAll, create, addAuditLog } from '@/server/db/store';
import { paginate } from '@/server/utils/pagination';

export async function GET(request) {
  const { errorResponse, user } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const all = url.searchParams.get('all');

  let tables = await getAll('dynamicTables');

  // Filter based on user role and sharing permissions:
  if (user?.role !== 'admin') {
    tables = tables.filter((tbl) => {
      if (!tbl.sharedWith || tbl.sharedWith === 'all') return true;
      if (Array.isArray(tbl.sharedWith)) {
        if (tbl.sharedWith.includes('all')) return true;
        if (tbl.sharedWith.includes(user.id) || tbl.sharedWith.includes(user.email)) return true;
      }
      return false;
    });
  }

  const result = paginate(tables, { page, limit, all });

  return NextResponse.json(
    {
      success: true,
      data: result.data,
      pagination: result.pagination,
      total: result.total
    },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  );
}

export async function POST(request) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    if (!body.title || !body.rows || !body.columns) {
      return NextResponse.json(
        { success: false, error: 'Thiếu tiêu đề, danh sách cột hoặc dòng dữ liệu' },
        { status: 400 }
      );
    }

    const newTable = await create('dynamicTables', {
      title: body.title.trim(),
      sourceFileName: body.sourceFileName || 'import.xlsx',
      importedAt: new Date().toISOString(),
      importedBy: user.name,
      rowCount: body.rows.length,
      columns: body.columns,
      rows: body.rows,
      sharedWith: Array.isArray(body.sharedWith) && body.sharedWith.length > 0 ? body.sharedWith : ['all']
    });

    await addAuditLog('IMPORT_DYNAMIC_TABLE', `Nhập dữ liệu thành công tạo bảng "${newTable.title}" (${body.rows.length} dòng)`, user);

    return NextResponse.json({
      success: true,
      data: newTable
    });
  } catch (err) {
    console.error('Error saving dynamic table:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi lưu bảng dữ liệu động' }, { status: 500 });
  }
}
