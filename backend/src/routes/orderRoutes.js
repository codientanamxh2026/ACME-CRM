const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.post('/', requireRole(['admin', 'manager', 'staff']), orderController.createOrder);
router.put('/:id/status', requireRole(['admin', 'manager', 'staff']), orderController.updateOrderStatus);
router.delete('/:id', requireRole(['admin']), orderController.deleteOrder);

module.exports = router;
