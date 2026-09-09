const express = require('express');
const cors = require('cors');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const config = require('./config/config');
const routes = require('./routes');
const swaggerDocument = require('./docs/swagger');
const { errorHandler } = require('./middlewares/errorMiddleware');

const app = express();

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost or standard frontend origin
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Body parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Swagger Documentation UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount main API router
app.use('/api', routes);

// Welcome root
app.get('/', (req, res) => {
  res.json({
    message: 'Chào mừng đến với ACME CRM Production RESTful API Server',
    documentation: `http://localhost:${config.PORT}/api-docs`,
    api_health: `http://localhost:${config.PORT}/api/health`,
    version: '1.0.0'
  });
});

// Centralized error handler
app.use(errorHandler);

// Start Server
app.listen(config.PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 ACME CRM RESTful Backend API Server đang chạy!`);
  console.log(`📡 URL API:        http://localhost:${config.PORT}/api`);
  console.log(`📖 Swagger UI Docs: http://localhost:${config.PORT}/api-docs`);
  console.log(`❤️  Health Check:   http://localhost:${config.PORT}/api/health`);
  console.log(`=======================================================`);
});
