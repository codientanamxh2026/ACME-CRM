const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const upload = require('../middlewares/uploadMiddleware');
const { requireAuth } = require('../middlewares/authMiddleware');

router.use(requireAuth);

router.post('/upload', upload.single('file'), uploadController.uploadSpreadsheet);
router.get('/export/:entity', uploadController.exportEntity);

module.exports = router;
