const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const reportRoutes = require('./routes/reportRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(morgan('dev'));

// API Status & Root Discovery
app.get(['/api', '/api/'], (req, res) => {
  res.json({
    name: 'Inventory and Sales Tracker API',
    status: 'online',
    system: 'Inventory and Sales Tracker for Small Shops',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/login',
      products: '/api/products',
      categories: '/api/categories',
      suppliers: '/api/suppliers',
      customers: '/api/customers',
      purchases: '/api/purchases',
      sales: '/api/sales',
      reports: '/api/reports',
    },
  });
});

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Inventory and Sales Tracker for Small Shops',
    timestamp: new Date().toISOString(),
  });
});

// Mount SDS API Routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
