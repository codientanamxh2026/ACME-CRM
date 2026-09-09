const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);
router.post('/', requireRole(['admin', 'manager', 'staff']), customerController.createCustomer);
router.put('/:id', requireRole(['admin', 'manager', 'staff']), customerController.updateCustomer);
router.delete('/:id', requireRole(['admin', 'manager']), customerController.deleteCustomer);

module.exports = router;
