const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', statsController.getDashboardStats);
router.get('/dashboard', statsController.getDashboardStats);

module.exports = router;
