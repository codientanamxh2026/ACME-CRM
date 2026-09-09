const statsService = require('../services/statsService');

async function getDashboardStats(req, res, next) {
  try {
    const stats = await statsService.getDashboardStats();
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardStats
};
