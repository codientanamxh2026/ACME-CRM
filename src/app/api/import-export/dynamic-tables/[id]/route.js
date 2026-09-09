import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getById, update, remove, addAuditLog } from '@/server/db/store';
import { paginate } from '@/server/utils/pagination';

export async function GET(request, { params }) {
  try {
    const { errorResponse, user } = await requireAuth(request);
    if (errorResponse) return errorResponse;

    const resolvedParams = await params;
    const id = resolvedParams.id;

    const table = await getById('dynamicTables', id);
    if (!table) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy bảng dữ liệu' }, { status: 404 });
    }

    // Permission check for non-admin users
    if (user?.role !== 'admin') {
      const isShared =
        !table.sharedWith ||
        table.sharedWith === 'all' ||
        (Array.isArray(table.sharedWith) && (
          table.sharedWith.includes('all') ||
          table.sharedWith.includes(user.id) ||
          table.sharedWith.includes(user.email)
        ));

      if (!isShared) {
        return NextResponse.json({
          success: false,
          error: 'Bạn không có quyền truy cập bảng dữ liệu này. Vui lòng liên hệ Quản trị viên để được cấp quyền chia sẻ.'
        }, { status: 403 });
      }
    }

    const url = new URL(request.url);
    const page = url.searchParams.get('page');
    const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
    const all = url.searchParams.get('all');

    if (page || limit) {
      const result = paginate(table.rows || [], { page, limit, all });
      return NextResponse.json({
        success: true,
        data: {
          ...table,
          rows: result.data
        },
        pagination: result.pagination,
        total: result.total
      });
    }

    return NextResponse.json(
      { success: true, data: table },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('Error fetching dynamic table by id:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Lỗi máy chủ khi lấy bảng dữ liệu'
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('dynamicTables', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy bảng dữ liệu' }, { status: 404 });
  }

  try {
    const body = await request.json();

    const updatePayload = {
      title: body.title !== undefined ? body.title.trim() : existing.title,
      slug: body.slug !== undefined ? body.slug.trim() : (existing.slug || existing.id),
      columns: body.columns !== undefined ? body.columns : existing.columns,
      rows: body.rows !== undefined ? body.rows : existing.rows,
      rowCount: body.rows !== undefined ? body.rows.length : existing.rowCount,
      sharedWith: body.sharedWith !== undefined ? body.sharedWith : (existing.sharedWith || ['all'])
    };

    const updated = await update('dynamicTables', existing.id, updatePayload);
    await addAuditLog('UPDATE_DYNAMIC_TABLE', `Cập nhật dữ liệu/quyền chia sẻ bảng "${updated?.title || existing.title}"`, user);

    return NextResponse.json(
      { success: true, data: updated },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (err) {
    console.error('Error updating dynamic table:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật bảng dữ liệu' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('dynamicTables', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy bảng dữ liệu' }, { status: 404 });
  }

  await remove('dynamicTables', id);
  await addAuditLog('DELETE_DYNAMIC_TABLE', `Xóa bảng dữ liệu import "${existing.title}"`, user);

  return NextResponse.json({ success: true, message: 'Đã xóa bảng dữ liệu thành công' });
}
