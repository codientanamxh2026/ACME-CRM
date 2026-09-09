const orderService = require('../services/orderService');

async function getOrders(req, res, next) {
  try {
    const result = await orderService.getOrders(req.query);
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      total: result.total
    });
  } catch (err) {
    next(err);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
}

async function createOrder(req, res, next) {
  try {
    const newOrder = await orderService.createOrder(req.body, req.user);
    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function updateOrderStatus(req, res, next) {
  try {
    const { status, paymentStatus } = req.body;
    const updated = await orderService.updateOrderStatus(req.params.id, status, paymentStatus, req.user);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function deleteOrder(req, res, next) {
  try {
    await orderService.deleteOrder(req.params.id, req.user);
    res.json({ success: true, message: 'Đã xóa đơn hàng thành công' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
