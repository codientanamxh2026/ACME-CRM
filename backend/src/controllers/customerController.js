const customerService = require('../services/customerService');

async function getCustomers(req, res, next) {
  try {
    const result = await customerService.getCustomers(req.query, req.user);
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

async function getCustomerById(req, res, next) {
  try {
    const customer = await customerService.getCustomerById(req.params.id);
    res.json({ success: true, data: customer });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
}

async function createCustomer(req, res, next) {
  try {
    const newCustomer = await customerService.createCustomer(req.body, req.user);
    res.status(201).json({ success: true, data: newCustomer });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function updateCustomer(req, res, next) {
  try {
    const updated = await customerService.updateCustomer(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function deleteCustomer(req, res, next) {
  try {
    await customerService.deleteCustomer(req.params.id, req.user);
    res.json({ success: true, message: 'Đã xóa khách hàng thành công' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
