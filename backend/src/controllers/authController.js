const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      ...result
    });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
}

async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id);
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ success: false, error: err.message });
  }
}

async function logout(req, res) {
  res.json({ success: true, message: 'Đăng xuất thành công' });
}

module.exports = {
  login,
  getMe,
  logout
};
