const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/config');

async function login(email, password) {
  if (!email || !password) {
    throw new Error('Vui lòng cung cấp đầy đủ email và mật khẩu');
  }

  const users = await db.getAll('users');
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  if (user.status === 'inactive') {
    throw new Error('Tài khoản này đang bị tạm khóa');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Email hoặc mật khẩu không chính xác');
  }

  const payload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department
  };

  const token = jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });

  await db.addAuditLog('USER_LOGIN', `Người dùng ${user.name} (${user.email}) đăng nhập qua Backend REST API.`, user);

  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone
  };

  return { token, user: safeUser };
}

async function getMe(userId) {
  const user = await db.getById('users', userId);
  if (!user || user.status === 'inactive') {
    throw new Error('Tài khoản không tồn tại hoặc đã bị vô hiệu hóa');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone
  };
}

module.exports = {
  login,
  getMe
};
