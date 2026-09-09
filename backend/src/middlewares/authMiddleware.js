const jwt = require('jsonwebtoken');
const config = require('../config/config');

function requireAuth(req, res, next) {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token && req.cookies && req.cookies.crm_token) {
    token = req.cookies.crm_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Vui lòng đăng nhập để truy cập tài nguyên này'
    });
  }

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Phiên làm việc đã hết hạn hoặc token không hợp lệ'
    });
  }
}

function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực người dùng'
      });
    }

    if (req.user.role === 'admin') {
      return next(); // Admin has universal access
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Bạn không có quyền thực hiện thao tác này. Yêu cầu quyền: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole
};
