import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getById, update, remove, addAuditLog } from '@/server/db/store';
import { hashPassword } from '@/server/auth/password';

export async function GET(request, { params }) {
  const { errorResponse, user: currentUser } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Only admin or the user itself can view the user details
  if (currentUser.role !== 'admin' && currentUser.id !== id) {
    return NextResponse.json({ success: false, error: 'Không có quyền truy cập' }, { status: 403 });
  }

  const user = await getById('users', id);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
  }

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    status: user.status,
    createdAt: user.createdAt
  };

  return NextResponse.json({ success: true, data: safeUser });
}

export async function PUT(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('users', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
  }

  try {
    const body = await request.json();

    const updatePayload = {
      name: body.name !== undefined ? body.name.trim() : existing.name,
      role: body.role !== undefined ? body.role : existing.role,
      department: body.department !== undefined ? body.department.trim() : existing.department,
      phone: body.phone !== undefined ? body.phone.trim() : existing.phone,
      status: body.status !== undefined ? body.status : existing.status
    };

    if (body.password) {
      updatePayload.passwordHash = await hashPassword(body.password);
    }

    const updated = await update('users', id, updatePayload);
    await addAuditLog('UPDATE_USER', `Cập nhật thông tin tài khoản ${updated.name} (${updated.email})`, user);

    const safeUser = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      department: updated.department,
      phone: updated.phone,
      status: updated.status
    };

    return NextResponse.json({ success: true, data: safeUser });
  } catch (err) {
    console.error('Error updating user:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật tài khoản' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  if (id === user.id) {
    return NextResponse.json(
      { success: false, error: 'Bạn không thể tự xóa tài khoản của chính mình' },
      { status: 400 }
    );
  }

  const existing = await getById('users', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy người dùng' }, { status: 404 });
  }

  await remove('users', id);
  await addAuditLog('DELETE_USER', `Xóa tài khoản ${existing.name} (${existing.email})`, user);

  return NextResponse.json({ success: true, message: 'Đã xóa người dùng thành công' });
}
