import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getById, update, remove, addAuditLog } from '@/server/db/store';

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const customer = await getById('customers', id);
  if (!customer) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: customer });
}

export async function PUT(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'manager', 'staff']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('customers', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const updated = await update('customers', id, {
      name: body.name !== undefined ? body.name.trim() : existing.name,
      contactPerson: body.contactPerson !== undefined ? body.contactPerson.trim() : existing.contactPerson,
      phone: body.phone !== undefined ? body.phone.trim() : existing.phone,
      email: body.email !== undefined ? body.email.trim() : existing.email,
      address: body.address !== undefined ? body.address.trim() : existing.address,
      status: body.status !== undefined ? body.status : existing.status,
      group: body.group !== undefined ? body.group : existing.group,
      revenue: body.revenue !== undefined ? Number(body.revenue) : existing.revenue,
      assignedStaffId: body.assignedStaffId !== undefined ? body.assignedStaffId : existing.assignedStaffId,
      assignedStaffName: body.assignedStaffName !== undefined ? body.assignedStaffName : existing.assignedStaffName,
      notes: body.notes !== undefined ? body.notes.trim() : existing.notes
    });

    await addAuditLog('UPDATE_CUSTOMER', `Cập nhật thông tin khách hàng ${updated.name}`, user);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating customer:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật khách hàng' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'manager']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('customers', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy khách hàng' }, { status: 404 });
  }

  await remove('customers', id);
  await addAuditLog('DELETE_CUSTOMER', `Xóa khách hàng ${existing.name} (${existing.code})`, user);

  return NextResponse.json({ success: true, message: 'Đã xóa khách hàng thành công' });
}
