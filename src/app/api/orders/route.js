import { NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/server/auth/guard';
import { getAll, getById, create, adjustProductStock, addAuditLog } from '@/server/db/store';
import { paginate } from '@/server/utils/pagination';

export async function GET(request) {
  const { errorResponse } = await requireAuth(request);
  if (errorResponse) return errorResponse;

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || '';
  const search = (url.searchParams.get('search') || '').toLowerCase().trim();
  const page = url.searchParams.get('page');
  const limit = url.searchParams.get('limit') || url.searchParams.get('pageSize');
  const all = url.searchParams.get('all');

  let list = await getAll('orders');

  if (status) {
    list = list.filter((o) => o.status === status);
  }

  if (search) {
    list = list.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(search)) ||
        (o.customerName && o.customerName.toLowerCase().includes(search)) ||
        (o.createdByName && o.createdByName.toLowerCase().includes(search))
    );
  }

  const result = paginate(list, { page, limit, all });

  return NextResponse.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
    total: result.total
  });
}

export async function POST(request) {
  const { errorResponse, user } = await requireRole(request, ['admin', 'manager', 'staff']);
  if (errorResponse) return errorResponse;

  try {
    const body = await request.json();

    if (!body.customerId || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng chọn khách hàng và ít nhất một sản phẩm' },
        { status: 400 }
      );
    }

    const customer = await getById('customers', body.customerId);
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy khách hàng được chọn' },
        { status: 400 }
      );
    }

    // Validate and process items
    let subtotal = 0;
    const validatedItems = [];

    for (const item of body.items) {
      const product = await getById('products', item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `Không tìm thấy sản phẩm mã: ${item.productId}` },
          { status: 400 }
        );
      }

      const qty = Number(item.quantity) || 1;
      const price = Number(item.price) !== undefined ? Number(item.price) : product.salePrice;
      const total = price * qty;

      subtotal += total;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price,
        quantity: qty,
        total
      });

      // Automatically deduct product stock for the order
      await adjustProductStock(product.id, -qty);
    }

    const discount = Number(body.discount) || 0;
    const totalAmount = Math.max(0, subtotal - discount);

    const orders = await getAll('orders');
    const orderNumber = `ORD-2026-${String(orders.length + 1).padStart(3, '0')}`;

    const newOrder = await create('orders', {
      orderNumber,
      customerId: customer.id,
      customerName: customer.name,
      items: validatedItems,
      subtotal,
      discount,
      tax: 0,
      totalAmount,
      status: body.status || 'pending',
      paymentStatus: body.paymentStatus || 'unpaid',
      paymentMethod: body.paymentMethod || 'bank_transfer',
      createdBy: user.id,
      createdByName: user.name,
      notes: body.notes?.trim() || ''
    });

    // Automatically accumulate customer revenue
    await update('customers', customer.id, {
      revenue: (Number(customer.revenue) || 0) + totalAmount
    });

    await addAuditLog('CREATE_ORDER', `Tạo đơn hàng ${newOrder.orderNumber} cho ${customer.name} (Trị giá: ${totalAmount} ₫)`, user);

    return NextResponse.json({
      success: true,
      data: newOrder
    });
  } catch (err) {
    console.error('Error creating order:', err);
    return NextResponse.json(
      { success: false, error: 'Lỗi khi tạo đơn hàng' },
      { status: 500 }
    );
  }
}
