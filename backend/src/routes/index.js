const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const customerRoutes = require('./customerRoutes');
const productRoutes = require('./productRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const dynamicTableRoutes = require('./dynamicTableRoutes');
const uploadRoutes = require('./uploadRoutes');
const statsRoutes = require('./statsRoutes');

router.use('/auth', authRoutes);
router.use('/customers', customerRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/dynamic-tables', dynamicTableRoutes);
router.use('/import-export/dynamic-tables', dynamicTableRoutes);
router.use('/files', uploadRoutes);
router.use('/stats', statsRoutes);

// System health check
router.get('/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'ACME CRM Production RESTful API Server',
    version: '1.0.0'
  });
});

module.exports = router;
