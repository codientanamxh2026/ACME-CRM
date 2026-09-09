const userService = require('../services/userService');

async function getUsers(req, res, next) {
  try {
    const result = await userService.getUsers(req.query);
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

async function createUser(req, res, next) {
  try {
    const newUser = await userService.createUser(req.body, req.user);
    res.status(201).json({ success: true, data: newUser });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function updateUser(req, res, next) {
  try {
    const updated = await userService.updateUser(req.params.id, req.body, req.user);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id, req.user);
    res.json({ success: true, message: 'Đã xóa người dùng thành công' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

async function getAuditLogs(req, res, next) {
  try {
    const logs = await userService.getAuditLogs();
    res.json({ success: true, data: logs });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs
};
