const bcrypt = require('bcryptjs');
const db = require('../config/db');
const { paginate } = require('../utils/pagination');

async function getUsers(query = {}) {
  const users = await db.getAll('users');
  const safeUsers = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    department: u.department,
    phone: u.phone,
    status: u.status,
    createdAt: u.createdAt
  }));

  return paginate(safeUsers, query);
}

async function createUser(data, adminUser) {
  if (!data.name || !data.email || !data.password || !data.role) {
    throw new Error('Họ tên, email, mật khẩu và vai trò phân quyền là bắt buộc');
  }

  const users = await db.getAll('users');
  const existing = users.find((u) => u.email.toLowerCase() === data.email.toLowerCase().trim());
  if (existing) {
    throw new Error('Địa chỉ email này đã được sử dụng');
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const newUser = await db.create('users', {
    name: data.name.trim(),
    email: data.email.toLowerCase().trim(),
    passwordHash,
    role: data.role,
    department: data.department ? data.department.trim() : 'Phòng Kinh Doanh',
    phone: data.phone ? data.phone.trim() : '',
    status: data.status || 'active'
  });

  await db.addAuditLog('CREATE_USER', `Admin tạo tài khoản mới: ${newUser.name} (${newUser.email}) - Quyền: ${newUser.role}`, adminUser);

  return {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    department: newUser.department,
    phone: newUser.phone,
    status: newUser.status,
    createdAt: newUser.createdAt
  };
}

async function updateUser(id, data, adminUser) {
  const existing = await db.getById('users', id);
  if (!existing) throw new Error('Không tìm thấy người dùng');

  const updatePayload = {
    name: data.name !== undefined ? data.name.trim() : existing.name,
    role: data.role !== undefined ? data.role : existing.role,
    department: data.department !== undefined ? data.department.trim() : existing.department,
    phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
    status: data.status !== undefined ? data.status : existing.status
  };

  if (data.password) {
    updatePayload.passwordHash = await bcrypt.hash(data.password, 10);
  }

  const updated = await db.update('users', id, updatePayload);
  await db.addAuditLog('UPDATE_USER', `Cập nhật thông tin tài khoản ${updated.name} (${updated.email})`, adminUser);

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    department: updated.department,
    phone: updated.phone,
    status: updated.status
  };
}

async function deleteUser(id, adminUser) {
  if (id === adminUser.id) {
    throw new Error('Bạn không thể tự xóa tài khoản của chính mình');
  }

  const existing = await db.getById('users', id);
  if (!existing) throw new Error('Không tìm thấy người dùng');

  await db.remove('users', id);
  await db.addAuditLog('DELETE_USER', `Xóa tài khoản người dùng ${existing.name} (${existing.email})`, adminUser);
  return true;
}

async function getAuditLogs() {
  return await db.getAll('auditLogs');
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  getAuditLogs
};
