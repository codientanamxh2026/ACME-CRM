const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireRole } = require('../middlewares/authMiddleware');

router.use(requireAuth);
router.use(requireRole(['admin']));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/audit-logs/all', userController.getAuditLogs);

module.exports = router;
