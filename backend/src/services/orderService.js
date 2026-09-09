const db = require('../config/db');
const { paginate } = require('../utils/pagination');

async function getOrders(query = {}) {
  let list = await db.getAll('orders');
  const { status, search } = query;

  if (status) {
    list = list.filter((o) => o.status === status);
  }

  if (search) {
    const term = search.toLowerCase().trim();
    list = list.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.createdByName && o.createdByName.toLowerCase().includes(term))
    );
  }

  return paginate(list, query);
}

async function getOrderById(id) {
  const order = await db.getById('orders', id);
  if (!order) throw new Error('Không tìm thấy đơn hàng');
  return order;
}

async function createOrder(data, user) {
  if (!data.customerId || !data.items || data.items.length === 0) {
    throw new Error('Vui lòng chọn khách hàng và ít nhất một sản phẩm đặt mua');
  }

  const customer = await db.getById('customers', data.customerId);
  if (!customer) throw new Error('Không tìm thấy khách hàng được chọn');

  let subtotal = 0;
  const validatedItems = [];

  for (const item of data.items) {
    const product = await db.getById('products', item.productId);
    if (!product) throw new Error(`Không tìm thấy sản phẩm id: ${item.productId}`);

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

    // Auto deduct product stock in real-time
    await db.adjustProductStock(product.id, -qty);
  }

  const discount = Number(data.discount) || 0;
  const totalAmount = Math.max(0, subtotal - discount);

  const orders = await db.getAll('orders');
  const orderNumber = `ORD-2026-${String(orders.length + 1).padStart(3, '0')}`;

  const newOrder = await db.create('orders', {
    orderNumber,
    customerId: customer.id,
    customerName: customer.name,
    items: validatedItems,
    subtotal,
    discount,
    tax: 0,
    totalAmount,
    status: data.status || 'pending',
    paymentStatus: data.paymentStatus || 'unpaid',
    paymentMethod: data.paymentMethod || 'bank_transfer',
    createdBy: user?.id,
    createdByName: user?.name,
    notes: data.notes ? data.notes.trim() : ''
  });

  // Automatically accumulate customer revenue
  await db.update('customers', customer.id, {
    revenue: (Number(customer.revenue) || 0) + totalAmount
  });

  await db.addAuditLog('CREATE_ORDER', `Tạo đơn hàng ${newOrder.orderNumber} trị giá ${totalAmount} ₫ cho ${customer.name}`, user);
  return newOrder;
}

async function updateOrderStatus(id, status, paymentStatus, user) {
  const existing = await db.getById('orders', id);
  if (!existing) throw new Error('Không tìm thấy đơn hàng');

  // If order cancelled, restore stock and adjust revenue
  if (status === 'cancelled' && existing.status !== 'cancelled') {
    if (Array.isArray(existing.items)) {
      for (const item of existing.items) {
        await db.adjustProductStock(item.productId, item.quantity);
      }
    }
    if (existing.customerId) {
      const cust = await db.getById('customers', existing.customerId);
      if (cust) {
        await db.update('customers', cust.id, {
          revenue: Math.max(0, (Number(cust.revenue) || 0) - Number(existing.totalAmount || 0))
        });
      }
    }
    await db.addAuditLog('CANCEL_ORDER', `Đơn hàng ${existing.orderNumber} đã hủy. Đã hoàn lại số lượng tồn kho.`, user);
  }

  const updateData = {};
  if (status) updateData.status = status;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  const updated = await db.update('orders', id, updateData);
  await db.addAuditLog('UPDATE_ORDER_STATUS', `Cập nhật đơn hàng ${updated.orderNumber} sang trạng thái: ${status || existing.status}`, user);
  return updated;
}

async function deleteOrder(id, user) {
  const existing = await db.getById('orders', id);
  if (!existing) throw new Error('Không tìm thấy đơn hàng');

  await db.remove('orders', id);
  await db.addAuditLog('DELETE_ORDER', `Quản trị viên xóa đơn hàng ${existing.orderNumber}`, user);
  return true;
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
