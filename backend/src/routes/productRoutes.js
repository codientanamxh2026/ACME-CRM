const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.post('/', requireRole(['admin', 'inventory']), productController.createProduct);
router.put('/:id', requireRole(['admin', 'inventory']), productController.updateProduct);
router.post('/:id/adjust-stock', requireRole(['admin', 'inventory']), productController.adjustStock);
router.delete('/:id', requireRole(['admin']), productController.deleteProduct);

module.exports = router;
