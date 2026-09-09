const express = require('express');
const router = express.Router();
const dynamicTableController = require('../controllers/dynamicTableController');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.get('/', dynamicTableController.getDynamicTables);
router.get('/:id', dynamicTableController.getDynamicTableById);
router.post('/', dynamicTableController.saveDynamicTable);
router.delete('/:id', dynamicTableController.deleteDynamicTable);

module.exports = router;
