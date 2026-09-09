import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getById, update, remove, adjustProductStock, addAuditLog } from '@/server/db/store';

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const order = await getById('orders', id);
  if (!order) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: order });
}

export async function PUT(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'manager', 'staff']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('orders', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Check if status changed to cancelled -> restore inventory and adjust revenue
    if (body.status === 'cancelled' && existing.status !== 'cancelled') {
      if (Array.isArray(existing.items)) {
        for (const item of existing.items) {
          await adjustProductStock(item.productId, item.quantity);
        }
      }
      if (existing.customerId) {
        const cust = await getById('customers', existing.customerId);
        if (cust) {
          await update('customers', cust.id, {
            revenue: Math.max(0, (Number(cust.revenue) || 0) - Number(existing.totalAmount || 0))
          });
        }
      }
      await addAuditLog('CANCEL_ORDER', `Đơn hàng ${existing.orderNumber} đã bị hủy. Đã hoàn trả số lượng vào kho.`, user);
    }

    const updated = await update('orders', id, {
      status: body.status !== undefined ? body.status : existing.status,
      paymentStatus: body.paymentStatus !== undefined ? body.paymentStatus : existing.paymentStatus,
      paymentMethod: body.paymentMethod !== undefined ? body.paymentMethod : existing.paymentMethod,
      notes: body.notes !== undefined ? body.notes.trim() : existing.notes
    });

    await addAuditLog('UPDATE_ORDER', `Cập nhật đơn hàng ${updated.orderNumber} (Trạng thái: ${updated.status})`, user);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating order:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật đơn hàng' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('orders', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
  }

  await remove('orders', id);
  await addAuditLog('DELETE_ORDER', `Quản trị viên xóa đơn hàng ${existing.orderNumber}`, user);

  return NextResponse.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
}
