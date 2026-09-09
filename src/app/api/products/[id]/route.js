import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getById, update, remove, adjustProductStock, addAuditLog } from '@/server/db/store';

export async function GET(request, { params }) {
  const { errorResponse } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product = await getById('products', id);
  if (!product) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm trong kho' }, { status: 404 });
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PUT(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'inventory']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('products', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm' }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Check if this is a quick stock adjustment (Stock In / Out)
    if (body.stockDelta !== undefined) {
      const delta = Number(body.stockDelta);
      const updated = await adjustProductStock(id, delta);
      const actionText = delta > 0 ? `Nhập kho +${delta}` : `Xuất kho ${delta}`;
      await addAuditLog('ADJUST_STOCK', `${actionText} cho sản phẩm ${existing.name} (${existing.sku}). Ghi chú: ${body.note || 'Điều chỉnh thủ công'}`, user);
      return NextResponse.json({ success: true, data: updated });
    }

    const stock = body.stock !== undefined ? Number(body.stock) : existing.stock;
    const minStock = body.minStock !== undefined ? Number(body.minStock) : existing.minStock;

    let status = 'in_stock';
    if (stock === 0) status = 'out_of_stock';
    else if (stock <= minStock) status = 'low_stock';

    const updated = await update('products', id, {
      name: body.name !== undefined ? body.name.trim() : existing.name,
      category: body.category !== undefined ? body.category.trim() : existing.category,
      unit: body.unit !== undefined ? body.unit.trim() : existing.unit,
      costPrice: body.costPrice !== undefined ? Number(body.costPrice) : existing.costPrice,
      salePrice: body.salePrice !== undefined ? Number(body.salePrice) : existing.salePrice,
      stock,
      minStock,
      status,
      description: body.description !== undefined ? body.description.trim() : existing.description
    });

    await addAuditLog('UPDATE_PRODUCT', `Cập nhật thông tin sản phẩm ${updated.name} (${updated.sku})`, user);

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating product:', err);
    return NextResponse.json({ success: false, error: 'Lỗi khi cập nhật sản phẩm' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'inventory']);
  if (errorResponse) return errorResponse;

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const existing = await getById('products', id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sản phẩm' }, { status: 404 });
  }

  await remove('products', id);
  await addAuditLog('DELETE_PRODUCT', `Xóa sản phẩm ${existing.name} (${existing.sku}) khỏi kho`, user);

  return NextResponse.json({ success: true, message: 'Đã xóa sản phẩm thành công' });
}
